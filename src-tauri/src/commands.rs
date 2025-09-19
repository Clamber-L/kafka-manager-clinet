use rdkafka::admin::{AdminClient, AdminOptions, NewPartitions, NewTopic, TopicReplication};
use rdkafka::client::DefaultClientContext;
use rdkafka::config::ClientConfig;
use rdkafka::consumer::{BaseConsumer, Consumer};
use rdkafka::topic_partition_list::TopicPartitionList;
use serde::Serialize;
use tauri::command;

#[derive(Serialize)]
pub struct PartitionInfo {
    pub partition: i32,
    pub leader: i32,
}

#[derive(Serialize)]
pub struct TopicInfo {
    pub name: String,
    pub partitions: Vec<PartitionInfo>,
}

// 创建 AdminClient（管理操作）
fn create_admin(broker: &str) -> AdminClient<DefaultClientContext> {
    ClientConfig::new()
        .set("bootstrap.servers", broker)
        .create()
        .expect("AdminClient 创建失败")
}

// 获取 metadata
fn get_metadata(broker: &str) -> Result<rdkafka::metadata::Metadata, String> {
    // 使用 BaseConsumer 临时客户端
    let consumer: BaseConsumer = ClientConfig::new()
        .set("bootstrap.servers", broker)
        .set("group.id", "metadata_temp_group") // 临时消费组
        .set("enable.partition.eof", "false")
        .create()
        .map_err(|e| e.to_string())?;

    let metadata = consumer
        .fetch_metadata(None, std::time::Duration::from_secs(5))
        .map_err(|e| e.to_string())?;

    Ok(metadata)
}

// ========================
// Tauri 命令
// ========================

// 测试连接
#[command]
pub fn test_connection(broker: String) -> Result<String, String> {
    let metadata = get_metadata(&broker)?;
    Ok(format!(
        "连接成功，发现 {} 个 topic",
        metadata.topics().len()
    ))
}

// 列出 Topic + 分区信息
#[command]
pub fn list_topics(broker: String) -> Result<Vec<TopicInfo>, String> {
    let metadata = get_metadata(&broker)?;
    let mut topics = Vec::new();
    for t in metadata.topics() {
        let partitions = t
            .partitions()
            .iter()
            .map(|p| PartitionInfo {
                partition: p.id(),
                leader: p.leader(),
            })
            .collect();
        topics.push(TopicInfo {
            name: t.name().to_string(),
            partitions,
        });
    }
    Ok(topics)
}

// 创建 Topic
#[command]
pub async fn create_topic(
    broker: String,
    topic_name: String,
    partitions: i32,
    replication: i32,
) -> Result<String, String> {
    let admin = create_admin(&broker);
    let new_topic = NewTopic::new(
        &topic_name,
        partitions,
        TopicReplication::Fixed(replication),
    );
    admin
        .create_topics(&[new_topic], &AdminOptions::new())
        .await
        .map_err(|e| format!("创建 Topic 失败: {:?}", e))?;
    Ok(format!("Topic {} 创建成功", topic_name))
}

// 增加分区
#[command]
pub async fn add_partitions(
    broker: String,
    topic_name: String,
    new_partition_count: i32,
) -> Result<String, String> {
    let admin = create_admin(&broker);
    let new_parts = NewPartitions::new(&topic_name, new_partition_count as usize);
    admin
        .create_partitions(&[new_parts], &AdminOptions::new())
        .await
        .map_err(|e| format!("增加分区失败: {:?}", e))?;
    Ok(format!(
        "Topic {} 增加分区到 {}",
        topic_name, new_partition_count
    ))
}

// 查看消费组 offset + lag
#[command]
pub fn consumer_lag(
    broker: String
    // group_id: String,
    // topic: String,
) -> Result<serde_json::Value, String> {
    // 添加调试信息
    let group_id = String::from("shikeJnaStateGroupId");
    let topic = String::from("shikeJnaStateTopic");

    let consumer: BaseConsumer = ClientConfig::new()
        .set("bootstrap.servers", &broker)
        .set("group.id", &group_id)
        .set("enable.partition.eof", "false")
        .set("session.timeout.ms", "6000")
        .create()
        .map_err(|e| e.to_string())?;

    // 获取 topic 分区
    let metadata = get_metadata(&broker)?;
    let topic_meta = metadata
        .topics()
        .iter()
        .find(|t| t.name() == topic)
        .ok_or_else(|| format!("未找到 Topic {}", topic))?;

    let mut result = Vec::new();

    for partition in topic_meta.partitions() {
        let mut tpl = TopicPartitionList::new();
        tpl.add_partition(&topic, partition.id());

        let committed = consumer
            .committed_offsets(tpl.clone(), std::time::Duration::from_secs(5))
            .map_err(|e| e.to_string())?;

        let watermarks = consumer
            .fetch_watermarks(&topic, partition.id(), std::time::Duration::from_secs(5))
            .map_err(|e| e.to_string())?;
        let log_end = watermarks.1;

        for elem in committed.elements_for_topic(&topic) {
            result.push(serde_json::json!({
                "partition": elem.partition(),
                "committed_offset": elem.offset().to_raw(),
                "log_end_offset": log_end,
                "lag": log_end - elem.offset().to_raw().unwrap()
            }));
        }
    }

    Ok(serde_json::json!(result))
}

import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type Operation = "test_connection" | "list_topics" | "consumer_lag" | "create_topic" | "add_partitions";

export default function App() {
    const [broker, setBroker] = useState("192.168.0.133:9092");
    const [operation, setOperation] = useState<Operation>("test_connection");
    const [output, setOutput] = useState("");
    const [_, setTopics] = useState<string[]>([]);
    const [selectedTopic, setSelectedTopic] = useState("shikeJnaStateTopic");
    const [groupId, setGroupId] = useState("shikeJnaStateGroupId");
    const [partitions, setPartitions] = useState(1);
    const [replication, setReplication] = useState(1);

    // 清空输出
    const clearOutput = () => setOutput("");

    // 实时追加输出
    const appendOutput = (text: string) => setOutput(prev => prev + text + "\n");

    // 执行操作
    const runOperation = async () => {
        clearOutput();
        try {
            switch (operation) {
                case "test_connection": {
                    const res = await invoke<string>("test_connection", { broker });
                    appendOutput(res);
                    break;
                }
                case "list_topics": {
                    const res = await invoke<any>("list_topics", { broker });
                    appendOutput(JSON.stringify(res, null, 2));
                    // 更新下拉列表
                    setTopics(res.map((t: any) => t.name));
                    break;
                }
                case "consumer_lag": {
                    if (!selectedTopic || !groupId) {
                        appendOutput("错误: 请选择 Topic 和输入 Group ID");
                        return;
                    }
                    // 添加调试信息
                    appendOutput(`调试信息: broker=${broker}, group_id=${groupId}, topic=${selectedTopic}`);
                    const res = await invoke<any>("consumer_lag", { broker, group_id: groupId, topic: selectedTopic });
                    appendOutput(JSON.stringify(res, null, 2));
                    break;
                }
                case "create_topic": {
                    if (!selectedTopic) {
                        appendOutput("请输入 Topic 名称");
                        return;
                    }
                    const res = await invoke<string>("create_topic", { broker, topic_name: selectedTopic, partitions, replication });
                    appendOutput(res);
                    break;
                }
                case "add_partitions": {
                    if (!selectedTopic) {
                        appendOutput("请选择 Topic");
                        return;
                    }
                    const res = await invoke<string>("add_partitions", { broker, topic_name: selectedTopic, new_partition_count: partitions });
                    appendOutput(res);
                    break;
                }
            }
        } catch (err) {
            appendOutput("操作失败: " + (err as any).toString());
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Kafka Tauri Demo</h1>

            <div className="mb-4">
                <label>Broker:</label>
                <input className="border p-1 ml-2" value={broker} onChange={e => setBroker(e.target.value)} />
            </div>

            <div className="mb-4">
                <label>操作类型:</label>
                <select className="border p-1 ml-2" value={operation} onChange={e => setOperation(e.target.value as Operation)}>
                    <option value="test_connection">测试连接</option>
                    <option value="list_topics">列出 Topic</option>
                    <option value="consumer_lag">查看消费组 lag</option>
                    <option value="create_topic">创建 Topic</option>
                    <option value="add_partitions">增加分区</option>
                </select>
            </div>

            {/* 动态参数表单 */}
            {(operation === "consumer_lag" || operation === "create_topic" || operation === "add_partitions") && (
                <div className="mb-4">
                    {(operation !== "create_topic" && operation !== "add_partitions") ? null : (
                        <div className="mb-2">
                            <label>Topic 名称:</label>
                            <input className="border p-1 ml-2" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} />
                        </div>
                    )}

                    {operation === "consumer_lag" && (
                        (
                            <>
                                <div className="mb-2">
                                    <label>topic:</label>
                                    <input className="border p-1 ml-2" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} />
                                </div>
                                <div className="mb-2">
                                    <label>消费组 ID:</label>
                                    <input className="border p-1 ml-2" value={groupId} onChange={e => setGroupId(e.target.value)} />
                                </div>
                            </>
                        )

                    )}

                    {(operation === "create_topic" || operation === "add_partitions") && (
                        <>
                            <div className="mb-2">
                                <label>分区数:</label>
                                <input
                                    className="border p-1 ml-2 w-20"
                                    type="number"
                                    value={partitions}
                                    onChange={e => setPartitions(parseInt(e.target.value))}
                                />
                            </div>
                            {operation === "create_topic" && (
                                <div className="mb-2">
                                    <label>副本数:</label>
                                    <input
                                        className="border p-1 ml-2 w-20"
                                        type="number"
                                        value={replication}
                                        onChange={e => setReplication(parseInt(e.target.value))}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <button className="bg-blue-500 text-white p-2 rounded" onClick={runOperation}>执行操作</button>

            <pre className="mt-4 p-2 bg-gray-100 h-64 overflow-auto">{output}</pre>
        </div>
    );
}

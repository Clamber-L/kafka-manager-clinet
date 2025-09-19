#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use kafka_client_lib::run;

mod commands;

fn main() {
    run();
}

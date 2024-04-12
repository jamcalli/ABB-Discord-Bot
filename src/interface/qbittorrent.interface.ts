import { ButtonInteraction } from 'discord.js';

export interface QBittorrentConfig {
    baseUrl: string;
    username: string;
    password: string;
}

export interface Task {
    (): Promise<void>;
}

export interface TorrentData {
    id: string;
    state: string;
    name: string;
    isCompleted: boolean;
}

export interface AllData {
    torrents: TorrentData[];
}

export interface DownloadingData {
    userId: string;
    bookName: string;
    i: ButtonInteraction;
}

export interface ExecResult {
    stdout: string;
    stderr: string;
}
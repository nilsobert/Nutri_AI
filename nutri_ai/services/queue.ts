import AsyncStorage from "@react-native-async-storage/async-storage";

export interface QueueItem {
  id: string;
  type: "CREATE_MEAL" | "UPDATE_MEAL" | "DELETE_MEAL";
  payload: any; // The meal object or ID
  retryCount: number;
  createdAt: number;
}

const QUEUE_KEY = "sync_queue";

export const QueueService = {
  async getQueue(): Promise<QueueItem[]> {
    try {
      const json = await AsyncStorage.getItem(QUEUE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error("[QueueService] Failed to load queue", e);
      return [];
    }
  },

  async saveQueue(queue: QueueItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      console.log(`[QueueService] Queue saved, length: ${queue.length}`);
    } catch (e) {
      console.error("[QueueService] Failed to save queue", e);
    }
  },

  async addToQueue(
    item: Omit<QueueItem, "createdAt" | "retryCount">,
  ): Promise<void> {
    const queue = await this.getQueue();

    if (queue.length >= 50) {
      console.warn("[QueueService] Queue full, dropping oldest item");
      queue.shift();
    }

    const newItem: QueueItem = {
      ...item,
      createdAt: Date.now(),
      retryCount: 0,
    };
    queue.push(newItem);
    await this.saveQueue(queue);
    console.log(`[QueueService] Item added: ${item.type} (${item.id})`);
  },

  async removeFromQueue(id: string): Promise<void> {
    const queue = await this.getQueue();
    const newQueue = queue.filter((item) => item.id !== id);
    await this.saveQueue(newQueue);
    console.log(`[QueueService] Item removed: ${id}`);
  },

  async updateItem(item: QueueItem): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      queue[index] = item;
      await this.saveQueue(queue);
    }
  },

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },
};

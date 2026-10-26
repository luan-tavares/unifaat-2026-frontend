export type Task = {
  id: string;
  name: string;
  isDone: boolean;
};

export type Filter = "all" | "pending" | "done";

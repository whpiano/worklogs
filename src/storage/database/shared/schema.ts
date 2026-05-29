import { pgTable, serial, integer, timestamp, varchar, text, boolean, date, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const tasks = pgTable(
	"tasks",
	{
		id: serial("id").primaryKey(),
		title: varchar("title", { length: 255 }).notNull(),
		description: text("description"),
		taskType: varchar("task_type", { length: 20 }).notNull().default("once"), // once | daily | weekly | monthly
		isActive: boolean("is_active").default(true).notNull(),
		startDate: date("start_date"), // 单次任务的任务日期/循环任务的起始日期
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("tasks_task_type_idx").on(table.taskType),
		index("tasks_is_active_idx").on(table.isActive),
		index("tasks_start_date_idx").on(table.startDate),
	]
);

export const taskCompletions = pgTable(
	"task_completions",
	{
		id: serial("id").primaryKey(),
		taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
		url: text("url"),
		note: text("note"),
		completedDate: date("completed_date").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("task_completions_task_id_idx").on(table.taskId),
		index("task_completions_completed_date_idx").on(table.completedDate),
	]
);

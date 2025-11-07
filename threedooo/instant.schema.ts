import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    tasks: i.entity({
      title: i.string(),
      position: i.number().indexed(),
      completed: i.boolean().indexed(),
      completedAt: i.number().optional(),
      createdAt: i.number().indexed(),
      updatedAt: i.number(),
      deleted: i.boolean().indexed(),
    }),
  },
  links: {
    userTasks: {
      forward: { on: 'tasks', has: 'one', label: 'user' },
      reverse: { on: '$users', has: 'many', label: 'tasks' },
    },
  },
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;

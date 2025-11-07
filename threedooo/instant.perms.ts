import type { InstantRules } from "@instantdb/react";

const rules = {
  tasks: {
    allow: {
      create: "auth.id != null && data.user == auth.id",
      update: "auth.id != null && data.user == auth.id",
      delete: "auth.id != null && data.user == auth.id",
    },
  },
} satisfies InstantRules;

export default rules;

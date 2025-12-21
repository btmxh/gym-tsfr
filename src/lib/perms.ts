import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
  events: ["create", "read", "read:own"],
  rooms: ["create", "read", "update", "delete"],
  equipments: ["create", "read", "update", "delete"],
  feedbacks: ["create", "read"],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  events: ["create", "read", "read:own"],
  rooms: ["create", "read", "update", "delete"],
  equipments: ["create", "read", "update", "delete"],
  feedbacks: ["create", "read"],
  ...adminAc.statements,
});

export const staff = ac.newRole({
  events: ["create", "read:own"],
  rooms: ["create", "read", "update", "delete"],
  equipments: ["create", "read", "update", "delete"],
  feedbacks: ["create", "read"],
});

export const coach = ac.newRole({
  events: ["read:own"],
  rooms: ["read"],
  equipments: ["read"],
  feedbacks: ["create", "read"],
});

export const user = ac.newRole({
  events: ["read:own"],
  rooms: ["read"],
  equipments: ["read"],
  feedbacks: ["create", "read"],
});

export const guest = ac.newRole({
  events: [],
  rooms: ["read"],
  equipments: ["read"],
  feedbacks: ["read"],
});

import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const submissions=sqliteTable('submissions',{
 id:text('id').primaryKey(),kind:text('kind').notNull(),name:text('name').notNull(),email:text('email').notNull(),company:text('company').notNull(),jobTitle:text('job_title').notNull().default(''),phone:text('phone').notNull().default(''),message:text('message').notNull().default(''),talkTitle:text('talk_title').notNull().default(''),profile:text('profile').notNull().default(''),consent:integer('consent').notNull(),createdAt:text('created_at').notNull()
},t=>[index('idx_submissions_kind_created').on(t.kind,t.createdAt)]);

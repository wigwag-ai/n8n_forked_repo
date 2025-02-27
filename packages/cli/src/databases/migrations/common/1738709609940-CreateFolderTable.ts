import type { MigrationContext, ReversibleMigration } from '@/databases/types';

export class CreateFolderTable1738709609940 implements ReversibleMigration {
	async up({ schemaBuilder: { createTable, column } }: MigrationContext) {
		await createTable('folder')
			.withColumns(
				column('id').varchar(36).primary.notNull,
				column('name').varchar(128).notNull,
				column('parentFolderId').varchar(36).default(null),
				column('projectId').varchar(36).notNull,
			)
			.withForeignKey('projectId', {
				tableName: 'project',
				columnName: 'id',
				onDelete: 'CASCADE',
			})
			.withForeignKey('parentFolderId', {
				tableName: 'folder',
				columnName: 'id',
				onDelete: 'CASCADE',
			})
			.withIndexOn(['projectId', 'id'], true).withTimestamps;

		await createTable('folder_tag')
			.withColumns(
				column('folderId').varchar(36).primary.notNull,
				column('tagId').varchar(36).primary.notNull,
			)
			.withForeignKey('folderId', {
				tableName: 'folder',
				columnName: 'id',
				onDelete: 'CASCADE',
			})
			.withForeignKey('tagId', {
				tableName: 'tag_entity',
				columnName: 'id',
				onDelete: 'CASCADE',
			});
	}

	async down({ runQuery, escape, schemaBuilder: { dropTable } }: MigrationContext) {
		const workflowTable = escape.tableName('workflow_entity');
		const workflowFolderId = escape.columnName('parentFolderId');

		await runQuery(`ALTER TABLE ${workflowTable} DROP COLUMN ${workflowFolderId}`);

		await dropTable('folder_tag');

		await dropTable('folder');
	}
}

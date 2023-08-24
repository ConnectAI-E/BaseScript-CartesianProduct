import {
  IFieldConfig,
  IFieldMeta,
  IOpenCellValue,
  IRecordValue,
  IWidgetTable,
  IWidgetView,
  bitable,
} from '@lark-base-open/web-api';

/**
 * 清空表
 * @param table 数据表对象
 */
export async function clearTable(table: IWidgetTable) {
  const fieldMetaList = await table.getFieldMetaList();

  // 删除所有字段
  await Promise.all([
    fieldMetaList.map(field => {
      return table.deleteField(field.id);
    }),
  ]);

  // 清空所有记录
  const recordIdList = await table.getRecordIdList();
  if (recordIdList.length > 0) {
    await table.deleteRecords(recordIdList);
  }
}

export interface Record {
  [fieldName: string]: IOpenCellValue;
}

export interface TableInfo {
  id: string;
  name: string;
  fields: IFieldMeta[];
  recordValues: IRecordValue[];
}

export interface TableDataInfo {
  id: string;
  name: string;
  fieldNames: string[];
  fieldMetaMap: { [key: string]: IFieldMeta };
  records: Record[];
}

export async function getTableInfo(table: IWidgetTable): Promise<TableInfo> {
  const name = await table.getName();
  const fields = await table.getFieldMetaList();
  const recordIds = await table.getRecordIdList();
  const recordValues = await Promise.all(recordIds.map(id => table.getRecordById(id)));
  return {
    id: table.id,
    name,
    fields,
    recordValues,
  };
}

export async function getTableViewInfo(table: IWidgetTable, view: IWidgetView): Promise<TableInfo> {
  const name = await table.getName();
  const fields = await view.getFieldMetaList();
  await table.getRecordIdList(); // 短期方案，未来去掉
  const recordIds = (await view.getVisibleRecordIdList()) as string[];
  const recordValues = await Promise.all(recordIds.map(id => table.getRecordById(id)));
  return {
    id: table.id,
    name,
    fields,
    recordValues,
  };
}

export async function getTableDataInfoByTableId(tableId: string): Promise<TableDataInfo> {
  const table = await bitable.base.getTableById(tableId);
  return getTableDataInfoByTable(table);
}

export async function getTableDataInfo(tableId: string, viewId: string): Promise<TableDataInfo> {
  const table = await bitable.base.getTableById(tableId);
  const view = await table.getViewById(viewId);
  const tableInfo = await getTableViewInfo(table, view);
  return translateTableDataInfo(tableInfo);
}

export async function getTableDataInfoByTable(table: IWidgetTable): Promise<TableDataInfo> {
  const tableInfo = await getTableInfo(table);
  return translateTableDataInfo(tableInfo);
}

export function translateTableDataInfo(tableInfo: TableInfo): TableDataInfo {
  const { id, name, fields, recordValues } = tableInfo;
  const fieldNameMap: { [key: string]: string } = {};
  const fieldNames: string[] = [];
  const fieldMetaMap: { [key: string]: IFieldMeta } = {};
  fields.forEach(field => {
    fieldNameMap[field.id] = field.name;
    fieldNames.push(field.name);
    fieldMetaMap[field.name] = field;
  });
  const records: Record[] = [];
  recordValues.forEach(record => {
    const res: Record = {};
    for (const key in record.fields) {
      res[fieldNameMap[key]] = record.fields[key];
    }
    records.push(res);
  });
  return {
    id,
    name,
    fieldNames,
    fieldMetaMap,
    records,
  };
}

export function translateFieldName(tableDataInfo: TableDataInfo): TableDataInfo {
  const fieldNameMap: { [key: string]: string } = {};
  const fieldNames: string[] = [];
  const fieldMetaMap: { [key: string]: IFieldMeta } = {};
  for (const name of tableDataInfo.fieldNames) {
    fieldNameMap[name] = tableDataInfo.name + '_' + name;
    fieldNames.push(fieldNameMap[name]);
    fieldMetaMap[fieldNameMap[name]] = tableDataInfo.fieldMetaMap[name];
  }
  const records: Record[] = [];
  tableDataInfo.records.forEach(record => {
    const res: Record = {};
    for (const name in record) {
      res[fieldNameMap[name]] = record[name];
    }
    records.push(res);
  });
  return {
    id: tableDataInfo.id,
    name: tableDataInfo.name,
    fieldNames,
    fieldMetaMap,
    records,
  };
}

export function connectTable(tableDataInfo1: TableDataInfo, tableDataInfo2: TableDataInfo): TableDataInfo {
  const fieldNames = [...tableDataInfo1.fieldNames, ...tableDataInfo2.fieldNames];
  const fieldMetaMap = { ...tableDataInfo1.fieldMetaMap, ...tableDataInfo2.fieldMetaMap };
  const records: Record[] = [];

  for (const r1 of tableDataInfo1.records) {
    for (const r2 of tableDataInfo2.records) {
      records.push({
        ...r1,
        ...r2,
      });
    }
  }

  return {
    id: tableDataInfo1.id,
    name: tableDataInfo1.name,
    fieldNames,
    fieldMetaMap,
    records,
  };
}

export async function writeTable(table: IWidgetTable, tableDataInfo: TableDataInfo) {
  const fieldNameMap: { [key: string]: string } = {};
  for (let name of tableDataInfo.fieldNames) {
    const fieldConfig = tableDataInfo.fieldMetaMap[name] as IFieldConfig;
    fieldConfig.name = name;
    const fieldId = await table.addField(fieldConfig);
    fieldNameMap[name] = fieldId;
  }
  const recordValues = tableDataInfo.records.map(record => {
    const fields: { [key: string]: IOpenCellValue } = {};
    for (const name in record) {
      fields[fieldNameMap[name]] = record[name];
    }
    return { fields };
  });

  await table.addRecords(recordValues);
}

export async function copyField(table: IWidgetTable, fieldId: string) {
  const fieldMeta = await table.getFieldMetaById(fieldId);
  fieldMeta.name += '_copy_' + Date.now();
  await table.addField(fieldMeta as IFieldConfig);
}

import { bitable, IWidgetTable, UIBuilder, ViewType } from '@lark-base-open/web-api';
import { clearTable, connectTable, getTableDataInfo, TableDataInfo, translateFieldName, writeTable } from './utils';
import { getText, I18nText } from './text';

export default async function main(uiBuilder: UIBuilder) {
  const lang = await bitable.bridge.getLanguage();
  const env = await bitable.bridge.getEnv();
  const t: I18nText = getText(lang, env);
  const tables = await bitable.base.getTableList();

  const tableInfos = await Promise.all(
    tables.map(async table => {
      const tableName = await table.getName();
      const viewMetaList = (await table.getViewMetaList()).filter(v => v.type === ViewType.Grid);
      return {
        tableId: table.id,
        tableName,
        viewMetaList,
      };
    }),
  );
  const options: { label: string; value: string }[] = [];

  tableInfos.forEach(tableInfo => {
    const name = tableInfo.tableName;
    for (let viewMeta of tableInfo.viewMetaList) {
      options.push({
        label: `${name}_${viewMeta.name}`,
        value: JSON.stringify({
          tableId: tableInfo.tableId,
          viewId: viewMeta.id,
        }),
      });
    }
  });

  uiBuilder.markdown(t.HeaderInfo);

  uiBuilder.form(
    form => ({
      formItems: [
        form.select('tableAndViewIds', {
          label: t.SelectConnectTable,
          options,
          allowClear: true,
          mode: 'multiple',
        }),
        form.tableSelect('outputTable', {
          label: t.SelectOutputTable,
          allowClear: true,
        }),
      ],
      buttons: [t.SubmitButton],
    }),
    async ({ values }) => {
      const tableAndViewIds = (values.tableAndViewIds as string[]).map(s => {
        return JSON.parse(s);
      }) as { tableId: string; viewId: string }[];
      const outputTable = values.outputTable as IWidgetTable;
      uiBuilder.showLoading(t.StartConnect);
      const success = await handle(uiBuilder, tableAndViewIds, outputTable, t);
      uiBuilder.hideLoading();
      if (success) {
        uiBuilder.message.success(t.ConnectSuccess);
      }
    },
  );
}

async function handle(
  uiBuilder: UIBuilder,
  ids: { tableId: string; viewId: string }[],
  outputTable: IWidgetTable,
  t: I18nText,
): Promise<boolean> {
  if (!ids || ids.length < 2) {
    uiBuilder.message.warning(t.SelectConnectCountWarning);
    return false;
  }
  uiBuilder.showLoading(t.GetTableData);
  const originalTableInfos = await Promise.all(ids.map(v => getTableDataInfo(v.tableId, v.viewId)));
  uiBuilder.showLoading(t.TranslateTableData);
  const tableInfos = originalTableInfos.map(info => translateFieldName(info));
  uiBuilder.showLoading(t.ConnectTableData);
  let outTableInfo: TableDataInfo = tableInfos[0];
  for (let i = 1; i < tableInfos.length; i++) {
    outTableInfo = connectTable(outTableInfo, tableInfos[i]);
  }
  uiBuilder.showLoading(t.SwitchOutputTable);
  await bitable.ui.switchBlock(outputTable.id);
  uiBuilder.showLoading(t.ClearOutputTableData);
  await clearTable(outputTable);
  uiBuilder.showLoading(t.WriteTableData);
  await writeTable(outputTable, outTableInfo);
  return true;
}

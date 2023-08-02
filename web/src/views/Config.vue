<template>
  <div>
    <a-button type="primary" @click="onClickAdd">新建配置</a-button>
  </div>
  <a-table :data="logConfigs" :columns="columns" :pagination="false" stripe style="margin-top: 24px">
    <template #tags="{ record }">
      <a-space>
        <a-tag v-for="(tag, i) in record.tags || []" :key="i">
          {{ tag.label }}: {{ tag.slug }}
        </a-tag>
      </a-space>
    </template>
    <template #action="{ record }">
      <a-space>
        <a-button type="text" @click="() => onClickEdit(record)">编辑</a-button>
        <a-button type="text" status="danger" @click="() => onClickDelete(record)">
          删除
        </a-button>
      </a-space>
    </template>
  </a-table>
  <a-modal v-model:visible="visible" :title="title" fullscreen @cancel="close" @ok="ok">
    <a-form ref="formRef" :model="form" :rules="rules" auto-label-width @submit="submit">
      <a-form-item field="timestamp" label="时间戳" v-show="false">
        <a-input v-model="form.timestamp" />
      </a-form-item>
      <a-form-item field="name" label="日志名称">
        <a-input v-model="form.name" placeholder="用于区分不同的日志" />
      </a-form-item>
      <a-form-item field="logPath" label="日志目录">
        <a-input v-model="form.logPath" placeholder="绝对路径，例如：/usr/local/logs/xx-project/" />
      </a-form-item>
      <a-form-item field="logFilename" label="日志文件名">
        <a-input v-model="form.logFilename" placeholder="包括文件扩展名，例如：request-log.log；支持正则匹配，例如：^request\-.*\.log$" />
      </a-form-item>
      <a-form-item field="tags" label="业务标签">
        <div>
          <a-table :data="form.tags" :columns="tagColumns" :pagination="false" :draggable="{ type: 'handle', width: 40 }"
            style="width: 100%" @change="handleTagTableChange">
            <template #label="{ record }">
              <a-input v-model="record.label" placeholder="标签名称" />
            </template>
            <template #slug="{ record }">
              <a-input v-model="record.slug" placeholder="标签key" />
            </template>
            <template #action="{ rowIndex }">
              <a-button size="small" type="text" status="danger" @click="() => onClickRemoveTag(rowIndex)">
                <template #icon>
                  <icon-minus-circle />
                </template>
              </a-button>
            </template>
          </a-table>
          <a-button type="outline" style="margin-top: 12px" @click="onClickAddTag">
            <template #icon>
              <icon-plus />
            </template>
            <span>添加标签</span>
          </a-button>
        </div>
      </a-form-item>
      <a-form-item field="customColumns" label="自定义列">
        <div>
          <a-table :data="form.customColumns" :columns="customColumnsColumns" :pagination="false"
            :draggable="{ type: 'handle', width: 40 }" style="width: 100%" @change="handleCustomColumnsTableChange">
            <template #title="{ record }">
              <a-input v-model="record.title" placeholder="列名称" />
            </template>
            <template #dataIndex="{ record }">
              <a-input v-model="record.dataIndex" placeholder="字段名" />
            </template>
            <template #type="{ record }">
              <a-select v-model="record.type" placeholder="类型">
                <a-option value="文本">文本</a-option>
                <a-option value="枚举">枚举</a-option>
                <a-option value="时间">时间</a-option>
                <a-option value="业务标签">业务标签</a-option>
              </a-select>
            </template>
            <template #enum="{ record }">
              <a-input v-model="record.enum" placeholder="逗号分隔" v-show="record.type === '枚举'" />
            </template>
            <template #width="{ record }">
              <div style="display: flex; align-items: center">
                <a-input-number v-model="record.width" placeholder="列宽" />
                <span style="width: 2.5em; flex-shrink: 0; text-align: right">像素</span>
              </div>
            </template>
            <template #fixed="{ record }">
              <a-select v-model="record.fixed">
                <a-option value="">不固定</a-option>
                <a-option value="left">固定在表格左侧</a-option>
                <a-option value="right">固定在表格右侧</a-option>
              </a-select>
            </template>
            <template #ellipsis="{ record }">
              <a-radio-group v-model="record.ellipsis" type="button">
                <a-radio :value="false">超长不省略</a-radio>
                <a-radio :value="true">超长省略</a-radio>
              </a-radio-group>
            </template>
            <template #action="{ rowIndex }">
              <a-button size="small" type="text" status="danger" @click="() => onClickRemoveCustomColumn(rowIndex)">
                <template #icon>
                  <icon-minus-circle />
                </template>
              </a-button>
            </template>
          </a-table>
          <a-button type="outline" style="margin-top: 12px" @click="onClickAddCustomColumn">
            <template #icon>
              <icon-plus />
            </template>
            <span>添加自定义列</span>
          </a-button>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Modal, Message } from "@arco-design/web-vue";
import { IconPlus, IconMinusCircle } from "@arco-design/web-vue/es/icon";
import { useLogConfig } from "../composables/useLogConfig";

type Tag = {
  label: string;
  slug: string;
};

type CustomColumn = {
  title: string;
  dataIndex: string;
  type: string;
  enum: string;
  width?: number;
  fixed: string;
  ellipsis: boolean;
};

type FormData = {
  id: string;
  timestamp: string;
  name: string;
  logPath: string;
  logFilename: string;
  tags: Tag[];
  customColumns: CustomColumn[];
};

const formRef = ref();
const form = ref<FormData>({
  id: "",
  timestamp: "",
  name: "",
  logPath: "",
  logFilename: "",
  tags: [{ label: "", slug: "" }],
  customColumns: [
    {
      title: "",
      dataIndex: "",
      type: "文本",
      enum: "",
      width: 200,
      fixed: "",
      ellipsis: true,
    },
  ],
});
const rules = ref({
  name: [
    {
      required: true,
      message: "请输入日志名称",
    },
  ],
  logPath: [
    {
      required: true,
      message: "请输入日志目录",
    },
  ],
  logFilename: [
    {
      required: true,
      message: "请输入日志文件名",
    },
  ],
});
const columns = ref([
  {
    title: "日志名称",
    dataIndex: "name",
  },
  {
    title: "日志目录",
    dataIndex: "logPath",
  },
  {
    title: "日志文件名",
    dataIndex: "logFilename",
  },
  {
    title: "业务标签",
    dataIndex: "tags",
    slotName: "tags",
  },
  {
    title: "操作",
    slotName: "action",
  },
]);
const tagColumns = ref([
  {
    title: "标签名称",
    dataIndex: "label",
    slotName: "label",
  },
  {
    title: "标签键名",
    dataIndex: "slug",
    slotName: "slug",
  },
  {
    title: "",
    slotName: "action",
  },
]);
const customColumnsColumns = ref([
  {
    title: "列名称 (必填)",
    dataIndex: "title",
    slotName: "title",
    width: 150,
  },
  {
    title: "字段名 (必填)",
    dataIndex: "dataIndex",
    slotName: "dataIndex",
    width: 150,
  },
  {
    title: "类型",
    dataIndex: "type",
    slotName: "type",
    width: 120,
  },
  {
    title: "枚举",
    dataIndex: "enum",
    slotName: "enum",
    width: 200,
  },
  {
    title: "列宽",
    dataIndex: "width",
    slotName: "width",
    width: 150,
  },
  {
    title: "固定列",
    dataIndex: "fixed",
    slotName: "fixed",
    width: 180,
  },
  {
    title: "文本省略",
    dataIndex: "ellipsis",
    slotName: "ellipsis",
    width: 230,
  },
  {
    title: "",
    slotName: "action",
  },
]);
const visible = ref(false);
const title = ref("");
const { logConfigs, loadLogConfigs } = useLogConfig();

onMounted(() => {
  loadLogConfigs();
});

function onClickAdd() {
  visible.value = true;
  title.value = "添加日志配置";
  formRef.value.resetFields();
}

function onClickEdit(row: any) {
  visible.value = true;
  title.value = "编辑日志配置";
  formRef.value.resetFields();
  form.value = JSON.parse(JSON.stringify(row));
}

function onClickDelete(row: any) {
  Modal.confirm({
    title: "确认删除",
    content: `确认删除日志配置 "${row.name}" 吗？`,
    onOk: async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}api/logConfig/delete`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: row.id,
          }),
        });
        const { code, msg } = await res.json();
        if (code) {
          throw new Error(msg);
        }
        Message.success({
          content: "删除成功",
        });
        await loadLogConfigs();
      } catch (e: any) {
        console.error(e);
        Modal.error({
          title: "删除失败",
          content: e.msg || "删除失败",
        });
      }
    },
  });
}

async function submit() {
  try {
    const url = form.value.id
      ? `${import.meta.env.VITE_BASE_URL}api/logConfig/update`
      : `${import.meta.env.VITE_BASE_URL}api/logConfig/add`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form.value),
    });
    const { code, msg } = await res.json();
    if (code) {
      throw new Error(msg);
    }
    Message.success({
      content: form.value.id ? "修改成功" : "添加成功",
    });
    formRef.value.resetFields();
    await loadLogConfigs();
  } catch (e: any) {
    console.error(e);
    Modal.error({
      title: form.value.id ? "修改失败" : "添加失败",
      content: e.msg || typeof e === "string" ? e : JSON.stringify(e),
    });
  }
}

async function ok() {
  await formRef.value.validate();
  await submit();
}

function close() {
  visible.value = false;
  formRef.value.resetFields();
}

function onClickAddTag() {
  form.value.tags.push({ label: "", slug: "" });
}
function onClickRemoveTag(index: number) {
  form.value.tags.splice(index, 1);
}
function handleTagTableChange(_data: any) {
  form.value.tags = _data;
}

function onClickAddCustomColumn() {
  form.value.customColumns.push({
    title: "",
    dataIndex: "",
    type: "文本",
    enum: "",
    width: 200,
    fixed: "",
    ellipsis: true,
  });
}
function onClickRemoveCustomColumn(index: number) {
  form.value.customColumns.splice(index, 1);
}
function handleCustomColumnsTableChange(_data: any) {
  form.value.customColumns = _data;
}
</script>

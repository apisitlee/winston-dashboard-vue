<template>
  <div>
    <a-button type="primary" @click="onClickAdd">新建配置</a-button>
  </div>
  <a-table
    :data="logConfigs"
    :columns="columns"
    :pagination="false"
    stripe
    style="margin-top: 24px"
  >
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
  <a-modal
    v-model:visible="visible"
    :title="title"
    width="680px"
    @cancel="close"
    @ok="ok"
  >
    <a-form ref="formRef" :model="form" :rules="rules" @submit="submit">
      <a-form-item field="timestamp" label="时间戳" v-show="false">
        <a-input v-model="form.timestamp" />
      </a-form-item>
      <a-form-item field="name" label="日志名称">
        <a-input v-model="form.name" />
      </a-form-item>
      <a-form-item field="logPath" label="日志目录">
        <a-input v-model="form.logPath" />
      </a-form-item>
      <a-form-item field="logFilename" label="日志文件名">
        <a-input v-model="form.logFilename" />
      </a-form-item>
      <a-form-item field="tags" label="业务标签">
        <div>
          <a-table
            :data="form.tags"
            :columns="tagColumns"
            :pagination="false"
            :draggable="{ type: 'handle', width: 40 }"
            style="width: 100%"
            @change="handleTagTableChange"
          >
            <template #label="{ record }">
              <a-input v-model="record.label" placeholder="标签名称" />
            </template>
            <template #slug="{ record }">
              <a-input v-model="record.slug" placeholder="标签key" />
            </template>
            <template #action="{ rowIndex }">
              <a-button
                size="small"
                type="text"
                status="danger"
                @click="() => onClickRemoveTag(rowIndex)"
              >
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
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Modal, Message } from "@arco-design/web-vue";
import { IconPlus, IconMinusCircle } from "@arco-design/web-vue/es/icon";

const logConfigs = ref<any>([]);
const formRef = ref();
const form = ref<any>({
  timestamp: "",
  name: "",
  logPath: "",
  logFilename: "",
  tags: [{ label: "", slug: "" }],
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
const visible = ref(false);
const title = ref("");

onMounted(() => {
  loadLogConfigs();
});

async function loadLogConfigs() {
  try {
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}api/logConfig/list`);
    const { data = [] } = await res.json();
    logConfigs.value = data;
  } catch (e) {
    console.error(e);
  }
}

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
            timestamp: row.timestamp,
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
    const url = form.value.timestamp
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
      content: form.value.timestamp ? "修改成功" : "添加成功",
    });
    formRef.value.resetFields();
    await loadLogConfigs();
  } catch (e: any) {
    console.error(e);
    Modal.error({
      title: form.value.timestamp ? "修改失败" : "添加失败",
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
</script>

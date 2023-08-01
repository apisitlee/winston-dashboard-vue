<template>
  <div>
    <a-spin :loading="loading" style="width: 100%">
      <div>
        <a-radio-group v-model="active" type="button" @change="onChangeSource">
          <a-radio :value="config.id" v-for="config in logConfigs">
            {{ config.name }}
          </a-radio>
        </a-radio-group>
      </div>
      <div style="margin: 12px 0">
        <a-space>
          <FilterPanel :filters="filters" :columns="columns" :tags="tagsDef" :filter-col-names="filterColNames" />
          <a-button type="text" :loading="loading" @click="() => handleRefresh()">
            <template #icon>
              <icon-refresh />
            </template>
          </a-button>
        </a-space>
      </div>
      <div class="query-form" v-show="false">
        <a-form :model="form" layout="inline" size="small" @submit="loadData">
          <a-form-item field="s">
            <a-input v-model="form.s" placeholder="模糊搜索日志内容" allow-clear />
          </a-form-item>
          <a-form-item field="level">
            <a-select v-model="form.level" placeholder="日志等级" allow-clear style="width: 120px">
              <a-option value="info">info</a-option>
              <a-option value="error">error</a-option>
            </a-select>
          </a-form-item>
          <a-form-item field="range">
            <a-range-picker v-model="form.range" format="YYYY-MM-DD HH:mm:ss" :placeholder="['开始日期', '结束日期']" allow-clear
              style="width: 240px" />
          </a-form-item>
          <a-form-item field="tag">
            <a-input-group>
              <a-select v-model="form.tag[0]" placeholder="标签名称" clearable style="width: 120px">
                <a-option v-for="tag in tagsDef" :value="tag.slug">
                  {{ tag.label }}
                </a-option>
              </a-select>
              <a-input v-model="form.tag[1]" placeholder="标签值" clearable style="width: 120px" />
            </a-input-group>
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button html-type="submit" type="primary" :loading="loading">
                查询
              </a-button>
              <a-button html-type="reset" @click="() => handleReset()"> 重置 </a-button>
              <a-button type="text" @click="() => handleRefresh()">
                <template #icon>
                  <icon-refresh />
                </template>
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </div>
      <a-table :data="tableData" :columns="columns" :pagination="false" :loading="loading" :scroll="{ x: '100%' }"
        scrollbar bordered stripe column-resizable>
        <template #_index="{ rowIndex }">{{ rowIndex + 1 }}</template>
        <template #level="{ record }">
          <span :class="record.level">{{ record.level }}</span>
        </template>
        <template #message="{ record }">
          {{ JSON.stringify(record.message) }}
        </template>
        <template #tags="{ record, rowIndex }">
          <a-space wrap>
            <a-tag v-for="(tag, ind) in Object.entries(record.tags || {})" :key="`${rowIndex}-${ind}`">
              {{ tagsMap[tag[0]] }}: {{ tag[1] }}
            </a-tag>
          </a-space>
        </template>
        <template #action="{ record, rowIndex }">
          <a-button type="text" style="margin-left: -16px" @click="() => onClickItem(record, rowIndex)">
            详情
          </a-button>
        </template>
      </a-table>
    </a-spin>
    <div class="log-table-foot" v-show="pagination.total !== 0">
      <a-pagination v-model:current="pagination.pageNo" v-model:page-size="pagination.pageSize" :total="pagination.total"
        :page-size-options="[10, 20, 50, 100]" show-total show-jumper show-page-size @change="loadData" />
    </div>
  </div>
  <DetailModal ref="detailModalRef" />
  <a-back-top />
</template>

<script setup lang="ts">
import { onMounted, ref, computed, ComputedRef } from "vue";
import { Modal } from "@arco-design/web-vue";
// @ts-ignore
import DetailModal from "./components/DetailModal.vue";
import { IconRefresh } from "@arco-design/web-vue/es/icon";
import FilterPanel from "../components/FilterPanel.vue";

const logConfigs = ref<any>([]);
const tableData = ref<any>([]);
const columnsBefore = ref([
  { title: "#", dataIndex: "_index", slotName: "_index", width: 60, fixed: "left" },
  {
    title: "日志等级",
    dataIndex: "level",
    slotName: "level",
    width: 80,
    type: "枚举",
    enum: "info,error",
  },
  {
    title: "日志内容",
    dataIndex: "message",
    slotName: "message",
    cellClass: "max-3-lines",
    type: "文本",
    width: 300,
  },
  {
    title: "业务标签",
    dataIndex: "tags",
    slotName: "tags",
    width: 200,
    type: "业务标签",
  },
]);
const columnsAfter = ref([
  { title: "记录时间", dataIndex: "timestamp", width: 180, type: "时间" },
  { title: "操作", dataIndex: "action", slotName: "action", width: 100, fixed: "right" },
]);
const customColumns = ref([]);
const columns: ComputedRef<any[]> = computed(() => {
  const list = [...columnsBefore.value, ...customColumns.value, ...columnsAfter.value];
  let left: any[] = [];
  let normal: any[] = [];
  let right: any[] = [];
  list.map((col: any) => {
    if (col.fixed === "left") {
      left.push(col);
    } else if (col.fixed === "right") {
      right.push(col);
    } else {
      normal.push(col);
    }
  });
  return [...left, ...normal, ...right];
});
const loading = ref(false);
const pagination = ref({
  hasNext: false,
  hasPrev: false,
  pageCount: 1,
  pageNo: 1,
  pageSize: 10,
  total: 0,
});
const filters = ref<any[]>([]);
const filterColNames = computed(() => {
  const list = columns.value.filter((item: any) => {
    return !["#", "操作"].includes(item.title);
  });
  return list;
});
const form = ref({
  level: "",
  s: "",
  range: [],
  tag: [],
  refresh: false,
});
const active = ref("");
const tagsDef = ref<any>([]);
const tagsMap = ref<any>({});
const detailModalRef = ref();

onMounted(async () => {
  await getActive();
  await loadData();
  setTagsByConfig();
  setCustomColumnsByConfig();
});

async function handleRefresh() {
  form.value.refresh = true;
  try {
    await loadData();
  } catch (e) {
    console.log(e);
  }
  form.value.refresh = false;
}
function handleReset() {
  form.value = {
    s: "",
    level: "",
    range: [],
    tag: [],
    refresh: false,
  };
  loadData();
}

async function loadLogConfigs() {
  try {
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}api/logConfig/list`, {
      method: "GET",
    });
    const data = await res.json();
    logConfigs.value = data.data || [];
  } catch (error) {
    console.error(error);
    Modal.error({
      title: "Error",
      content: typeof error === "string" ? error : JSON.stringify(error),
    });
  }
}

async function loadData() {
  if (loading.value) return;
  loading.value = true;
  try {
    await loadLogConfigs();
    const params: any = {
      s: form.value.s,
      level: form.value.level,
      range: form.value.range,
      pageSize: pagination.value.pageSize,
      pageNo: pagination.value.pageNo,
    };
    const requestUrl = new URL(
      `${import.meta.env.VITE_BASE_URL}api/query`,
      window.location.origin
    );
    Object.keys(params).forEach((key) =>
      requestUrl.searchParams.append(key, params[key])
    );
    const res = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    const {
      list = [],
      hasNext,
      hasPrev,
      pageCount = 1,
      pageNo = 1,
      pageSize = 10,
      total = 0,
    } = data.data || {};
    tableData.value = list;
    pagination.value = {
      hasNext,
      hasPrev,
      pageCount,
      pageNo,
      pageSize,
      total,
    };
  } catch (error) {
    console.error(error);
    Modal.error({
      title: "Error",
      content: typeof error === "string" ? error : JSON.stringify(error),
    });
  }
  loading.value = false;
}

async function getActive() {
  const res = await fetch(`${import.meta.env.VITE_BASE_URL}api/logConfig/active`);
  const { data } = await res.json();
  active.value = data;
}

async function onChangeSource(ev: any) {
  try {
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}api/logConfig/active`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: ev,
      }),
    });
    const data = await res.json();
    if (data.code) {
      throw data.msg;
    }
    setTagsByConfig();
    setCustomColumnsByConfig();
    await loadData();
  } catch (e) {
    console.error(e);
    Modal.error({
      title: "Error",
      content: typeof e === "string" ? e : JSON.stringify(e),
    });
  }
}

function setTagsByConfig() {
  let list: any[] = [];
  let map: Record<string, string> = {};
  const config = logConfigs.value.find((conf: any) => conf.id === active.value);
  if (config) {
    list = config.tags || [];
    list.map((tag: any) => {
      map[tag.slug] = tag.label;
    });
  }
  tagsDef.value = list;
  tagsMap.value = map;
}
function setCustomColumnsByConfig() {
  const config = logConfigs.value.find((conf: any) => conf.id === active.value);
  if (config) {
    customColumns.value = (config.customColumns || []).map((col: any) => {
      col.dataIndex = `message.${col.dataIndex}`;
      col.isCustom = true;
      return col;
    });
  }
}

function onClickItem(record: any, index: number) {
  detailModalRef.value.visible = true;
  detailModalRef.value.model = record;
  detailModalRef.value.index = index;
  detailModalRef.value.tagsMap = tagsMap.value;
}
</script>

<style scoped>
.query-form {
  margin: 12px 0 0 0;
}

.info {
  background-color: #e5edff;
  color: #165dff;
  padding: 0 8px;
}

.error {
  background: #ffecec;
  color: #ff2424;
  padding: 0 8px;
}

.log-table-foot {
  width: 100%;
  background-color: #165dff;
  background-color: #ffffff;
  color: #d6e2ff;
  color: #165dff;
  position: sticky;
  bottom: 0;
  padding: 12px;
  z-index: 100;
  box-sizing: border-box;
  border-top: 1px solid #dddddd;
}
</style>

<style>
.log-table .arco-form-item-layout-inline {
  margin-right: 0;
}

.max-3-lines .arco-table-td-content {
  width: 100%;
  max-height: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
</style>

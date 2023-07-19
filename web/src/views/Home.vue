<template>
  <div>
    <a-spin :loading="loading" style="width: 100%">
      <div>
        <a-radio-group v-model="active" type="button" @change="onChangeSource">
          <a-radio :value="config.timestamp" v-for="config in logConfigs">
            {{ config.name }}
          </a-radio>
        </a-radio-group>
      </div>
      <table class="log-table">
        <thead>
          <tr>
            <th colspan="4" style="padding: 18px 0 0 0">
              <a-form :model="form" layout="inline" size="small" @submit="handleSubmit">
                <a-form-item field="s">
                  <a-input v-model="form.s" placeholder="模糊搜索日志内容" allow-clear />
                </a-form-item>
                <a-form-item field="level">
                  <a-select
                    v-model="form.level"
                    placeholder="日志等级"
                    allow-clear
                    style="width: 120px"
                  >
                    <a-option value="info">info</a-option>
                    <a-option value="error">error</a-option>
                  </a-select>
                </a-form-item>
                <a-form-item field="range">
                  <a-range-picker
                    v-model="form.range"
                    show-time
                    :time-picker-props="{ defaultValue: ['00:00:00', '23:59:59'] }"
                    format="YYYY-MM-DD HH:mm"
                    :placeholder="['开始时间', '结束时间']"
                    allow-clear
                  />
                </a-form-item>
                <a-form-item>
                  <a-space>
                    <a-button html-type="submit" type="primary" :loading="loading">
                      查询
                    </a-button>
                    <a-button html-type="reset" @click="handleReset">重置</a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </th>
          </tr>
          <tr>
            <th>#</th>
            <th>日志等级</th>
            <th>日志内容</th>
            <th>记录时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in tableData" :key="i">
            <td class="col-index">{{ i + 1 }}</td>
            <td class="col-level">
              <span :class="row.level">{{ row.level }}</span>
            </td>
            <td>{{ row.message }}</td>
            <td class="col-time">{{ row.timestamp }}</td>
          </tr>
        </tbody>
      </table>
    </a-spin>
    <div class="log-table-foot" v-show="pagination.total !== 0">
      <a-pagination
        v-model:current="pagination.pageNo"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-size-options="[10, 20, 50, 100]"
        show-total
        show-jumper
        show-page-size
        @change="loadData"
      />
    </div>
  </div>
  <a-back-top />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Modal } from "@arco-design/web-vue";

const logConfigs = ref<any>([]);
const tableData = ref<any>([]);
const loading = ref(false);
const pagination = ref({
  hasNext: false,
  hasPrev: false,
  pageCount: 1,
  pageNo: 1,
  pageSize: 10,
  total: 0,
});
const form = ref({
  level: "",
  s: "",
  range: [],
});
const active = ref("");

onMounted(async () => {
  await getActive();
  await loadData();
});

const handleSubmit = () => {
  loadData();
};

const handleReset = () => {
  form.value = {
    s: "",
    level: "",
    range: [],
  };
  loadData();
};

async function loadLogConfigs() {
  try {
    const res = await fetch("/winston-dashboard-vue/api/logConfig/list", {
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
      "/winston-dashboard-vue/api/query",
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
  const res = await fetch("/winston-dashboard-vue/api/logConfig/active");
  const { data } = await res.json();
  active.value = data;
}

async function onChangeSource(ev: any) {
  try {
    const res = await fetch("/winston-dashboard-vue/api/logConfig/active", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timestamp: ev,
      }),
    });
    const data = await res.json();
    if (data.code) {
      throw data.msg;
    }
    await loadData();
  } catch (e) {
    console.error(e);
    Modal.error({
      title: "Error",
      content: typeof e === "string" ? e : JSON.stringify(e),
    });
  }
}
</script>

<style scoped>
.log-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid #dddddd;
  border-bottom: 0;
}

.log-table thead {
  background-color: #165dff;
  background-color: #ffffff;
  position: sticky;
  top: -1px;
  color: #d6e2ff;
  color: #165dff;
}

.log-table thead::after {
  content: "";
  display: block;
  clear: both;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background-color: #165dff;
  z-index: 10;
}

.log-table tbody tr:not(:last-child) {
  border-bottom: 1px solid #dddddd;
}

.log-table th,
.log-table td {
  text-align: left;
  padding: 16px;
}

.log-table tbody tr:nth-child(even) {
  background-color: #f1f6ff;
}

.log-table tbody tr:hover {
  background-color: #e9f0ff;
}

.col-index {
  width: 60px;
}

.col-level {
  width: 100px;
}

.col-time {
  width: 160px;
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
  box-sizing: border-box;
  border-top: 1px solid #dddddd;
}
</style>

<style>
.log-table .arco-form-item-layout-inline {
  margin-right: 0;
}
</style>

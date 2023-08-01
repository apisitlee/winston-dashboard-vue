<template>
    <a-popover trigger="click" position="bl">
        <a-button :type="filterNum ? 'primary' : 'text'">
            <template #icon>
                <icon-filter />
            </template>
            {{ filterNum ? `${filterNum} ` : "" }}筛选
        </a-button>
        <template #content>
            <section class="filter-pop-box">
                <div class="filter-pop-header">
                    <div>设置筛选条件</div>
                    <div v-show="filterList.length > 1">
                        符合以下
                        <a-select v-model="filterRelation" size="small" @change="handleRelationChange">
                            <a-option value="所有">所有</a-option>
                            <a-option value="任一">任一</a-option>
                        </a-select>
                        条件
                    </div>
                </div>
                <div class="filter-pop-body">
                    <div class="filter-row" v-for="(filter, index) in filterList" :key="index">
                        <a-row :gutter="12">
                            <a-col :span="6">
                                <a-select v-model="filter.colName" placeholder="请选择字段" style="width: 100%"
                                    @change="() => (filter.value = '')">
                                    <a-option v-for="(col, i) in filterColNames" :key="`${index}-${i}`"
                                        :value="col.colName">
                                        {{ col.title }}
                                    </a-option>
                                </a-select>
                            </a-col>
                            <a-col :span="4" v-if="getColTypeByName(filter.colName) === '业务标签'">
                                <a-select v-model="filter.tagKey" placeholder="请选择" allow-clear style="width: 100%">
                                    <a-option v-for="tag in tags" :value="tag.slug">
                                        {{ tag.label }}
                                    </a-option>
                                </a-select>
                            </a-col>
                            <a-col :span="4">
                                <a-select v-model="filter.relation" style="width: 100%">
                                    <a-option v-for="relation in getColRelations(filter.colName)" :value="relation">
                                        {{ relation }}
                                    </a-option>
                                </a-select>
                            </a-col>
                            <a-col :span="12" v-if="getColTypeByName(filter.colName) === '文本' &&
                                !['为空', '不为空'].includes(filter.relation)
                                ">
                                <a-input v-model="filter.value" placeholder="请输入" allow-clear style="width: 100%" />
                            </a-col>
                            <a-col :span="12" v-if="getColTypeByName(filter.colName) === '枚举' &&
                                !['为空', '不为空'].includes(filter.relation)
                                ">
                                <a-select v-model="filter.value" placeholder="请选择" allow-clear style="width: 100%">
                                    <a-option v-for="opt in getColEnumsByName(filter.colName)" :value="opt">
                                        {{ opt }}
                                    </a-option>
                                </a-select>
                            </a-col>
                            <a-col :span="12" v-if="getColTypeByName(filter.colName) === '时间' &&
                                !['为空', '不为空'].includes(filter.relation)
                                ">
                                <a-date-picker v-model="filter.value" placeholder="请选择" format="YYYY-MM-DD HH:mm:ss"
                                    show-time allow-clear style="width: 190px" />
                            </a-col>
                            <a-col :span="8" v-if="getColTypeByName(filter.colName) === '业务标签' &&
                                !['为空', '不为空'].includes(filter.relation)
                                ">
                                <a-input v-model="filter.value" placeholder="请输入" allow-clear style="width: 100%" />
                            </a-col>
                            <a-col :span="2">
                                <a-button type="text" status="danger" @click="() => handleRemoveFilter(index)">
                                    <template #icon>
                                        <icon-close />
                                    </template>
                                </a-button>
                            </a-col>
                        </a-row>
                    </div>
                </div>
                <div class="filter-pop-footer">
                    <a-button type="text" style="padding: 0" @click="handleAddFilter">
                        <template #icon>
                            <icon-plus />
                        </template>
                        添加条件
                    </a-button>
                    <a-space>
                        <a-button type="primary" @click="handleQuery">查询</a-button>
                        <a-button @click="handleReset">重置</a-button>
                    </a-space>
                </div>
            </section>
        </template>
    </a-popover>
</template>

<script setup lang="ts">
import { IconFilter, IconPlus, IconClose } from "@arco-design/web-vue/es/icon";
import { ref, computed, watch } from "vue";

type Props = {
    filters: any[];
    relation: string;
    columns: any[];
    tags: any[];
    filterColNames: any[];
};
const props = withDefaults(defineProps<Props>(), {
    relation: "所有",
});
const filterList = ref<any[]>([]);
const filterNum = computed(() => props.filters.length);
const filterRelation = ref("所有");
// 针对不同类型，关系列表不同
const relations: Record<string, any[]> = {
    文本: ["等于", "不等于", "包含", "不包含", "为空", "不为空"],
    枚举: ["等于", "不等于", "为空", "不为空"],
    时间: ["等于", "晚于", "早于", "为空", "不为空"],
    业务标签: ["等于", "不等于", "包含", "不包含", "为空", "不为空"],
};
const relationKeyMap: Record<string, string> = {
    等于: "eq",
    不等于: "neq",
    包含: "c",
    不包含: "nc",
    为空: "n",
    不为空: "nn",
    晚于: "lt",
    早于: "pt",
};

const emit = defineEmits(["query", "reset", "relation-change"]);

watch(props.filters, () => {
    filterList.value = props.filters;
});

watch([props.relation], () => {
    filterRelation.value = props.relation;
});

function getColTypeByName(colName: string) {
    const { type } = props.columns.find((col) => col.title === colName) || {};
    return type || "文本";
}
function getColRelations(colName: string): any[] {
    const type = getColTypeByName(colName);
    if (type in relations) {
        return relations[type];
    } else {
        return [];
    }
}
function getColEnumsByName(colName: string) {
    const { enum: enums = "" } = props.columns.find((col) => col.title === colName) || {};
    return enums ? enums.split(",") : [];
}

function handleAddFilter() {
    const newFilter = {
        colName: "日志内容",
        relation: "等于",
        value: "",
    };
    filterList.value.push(newFilter);
}
function handleRemoveFilter(index: number) {
    filterList.value.splice(index, 1);
}

function handleRelationChange() {
    emit("relation-change", filterRelation.value);
}

function handleQuery() {
    let list: any[] = [];
    Array.from(filterList.value).map((row: any) => {
        const column = props.columns.find((col) => col.title === row.colName);
        if (column) {
            if (column.type === "文本") {
                list.push({
                    dataIndex: column.dataIndex,
                    relation: relationKeyMap[row.relation],
                    value: row.value,
                    isCustom: column.isCustom || false,
                });
            } else if (column.type === "枚举") {
                list.push({
                    dataIndex: column.dataIndex,
                    relation: relationKeyMap[row.relation],
                    value: row.value,
                    isCustom: column.isCustom || false,
                });
            } else if (column.type === "时间") {
                list.push({
                    dataIndex: column.dataIndex,
                    relation: relationKeyMap[row.relation],
                    value: row.value,
                    isCustom: column.isCustom || false,
                });
            } else if (column.type === "业务标签") {
                list.push({
                    dataIndex: `${column.dataIndex}.${row.tagKey}`,
                    relation: relationKeyMap[row.relation],
                    value: row.value,
                    isCustom: column.isCustom || false,
                });
            }
        }
    });
    emit("query", list);
}
function handleReset() {
    filterList.value = [];
    emit("reset");
}
</script>

<style scoped>
.filter-pop-box {
    width: 650px;
    height: auto;
    overflow: hidden;
}

.filter-pop-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
}

.filter-pop-body {
    max-height: 280px;
    overflow: auto;
}

.filter-row {
    width: 100%;
}

.filter-row+.filter-row {
    margin-top: 12px;
}

.filter-pop-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
}
</style>

<style>
.filter-pop-header .arco-select-view-single {
    width: auto;
    padding-left: 6px;
    padding-right: 6px;
    background: transparent;
    border-color: #dddddd;
    border-radius: 6px;
}

.filter-pop-header .arco-select-view-single .arco-select-view-suffix {
    padding-left: 4px;
}

.filter-row .arco-select-view-single,
.filter-row .arco-input-wrapper {
    background-color: transparent;
    border-color: #dddddd;
    padding-left: 6px;
    padding-right: 6px;
    border-radius: 6px;
}

.filter-row .arco-picker {
    background-color: transparent;
    border-color: #dddddd;
    padding-left: 0;
    padding-right: 10px;
    border-radius: 6px;
}
</style>

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
                    <div v-show="filters.length > 1">
                        符合一下
                        <a-select v-model="filterRelation">
                            <a-option value="所有">所有</a-option>
                            <a-option value="任一">任一</a-option>
                        </a-select>
                        条件
                    </div>
                </div>
                <div class="filter-pop-body">
                    <div class="filter-row" v-for="(filter, index) in filters" :key="index">
                        <a-row :gutter="12">
                            <a-col :span="6">
                                <a-select v-model="filter.colName" placeholder="请选择字段" style="width: 100%">
                                    <a-option v-for="(col, i) in filterColNames" :key="`${index}-${i}`"
                                        :value="col.dataIndex">
                                        {{ col.title }}
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
                            <a-col :span="12" v-if="getColTypeByName(filter.colName) === '文本'">
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
                            <a-col :span="12" v-if="getColTypeByName(filter.colName) === '时间'">
                                <a-date-picker v-model="filter.value" placeholder="请选择" format="YYYY-MM-DD HH:mm:ss"
                                    show-time allow-clear style="width: 100%" />
                            </a-col>
                            <a-col :span="12" v-if="getColTypeByName(filter.colName) === '业务标签'">
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
                    <a-button type="text" @click="handleAddFilter">
                        <template #icon>
                            <icon-plus />
                        </template>
                        添加条件
                    </a-button>
                    <a-button size="small" type="text">
                        <template #icon>
                            <icon-save />
                        </template>
                        另存为新视图
                    </a-button>
                </div>
            </section>
        </template>
    </a-popover>
</template>

<script setup lang="ts">
import { IconFilter, IconPlus, IconSave, IconClose } from "@arco-design/web-vue/es/icon";
import { ref, computed } from "vue";

type Props = {
    filters: any[];
    columns: any[];
    filterColNames: any[];
};
const props = withDefaults(defineProps<Props>(), {});
const filterNum = computed(() => props.filters.length);
const filterRelation = ref("所有");
// 针对不同类型，关系列表不同
const relations: Record<string, any[]> = {
    文本: ["等于", "不等于", "包含", "不包含", "为空", "不为空"],
    枚举: ["等于", "不等于", "为空", "不为空"],
    时间: ["等于", "晚于", "早于", "为空", "不为空"],
    业务标签: ["等于", "不等于", "包含", "不包含", "为空", "不为空"],
};

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
        colName: "",
        relation: "等于",
        value: "",
    };
    props.filters.push(newFilter);
}
function handleRemoveFilter(index: number) {
    props.filters.splice(index, 1);
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
</style>

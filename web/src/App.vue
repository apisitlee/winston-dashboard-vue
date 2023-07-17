<script setup lang="ts">
import { useRoute } from "vue-router";
const route = useRoute();
const isActive = (path: string) => route.path === path;

const menu = [
  {
    title: "首页",
    path: "/",
  },
  {
    title: "配置",
    path: "/config",
  },
];
</script>

<template>
  <header class="page-header">
    <a-space>
      <h1 class="page-title">Log Dashboard</h1>
      <a-space>
        <router-link
          :class="{ 'menu-item': true, active: isActive(item.path) }"
          v-for="item in menu"
          :to="item.path"
        >
          {{ item.title }}
        </router-link>
      </a-space>
    </a-space>
  </header>
  <RouterView />
</template>

<style scoped>
.page-header {
  margin: 0 0 1em 0;
}
.page-title {
  margin: 0 48px 0 0;
  line-height: 1;
}
.menu-item {
  color: inherit;
  text-decoration: none;
  padding: 2px 8px;
}
.menu-item.active {
  background-color: #165dff;
  color: #ffffff;
}
</style>

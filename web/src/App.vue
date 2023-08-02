<script setup lang="ts">
import logo from "./assets/logo.svg";
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
  <div class="page">
    <aside class="page-aside">
      <h3 class="page-title">
        <img :src="logo" class="logo" />
        <span>Log Dashboard</span>
      </h3>
      <router-link :class="{ 'menu-item': true, active: isActive(item.path) }" v-for="item in menu" :to="item.path">
        {{ item.title }}
      </router-link>
    </aside>
    <main class="page-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.page {
  margin: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 24px;
}

.page-aside {
  width: 230px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  max-height: 100vh;
  overflow: auto;
}

.page-main {
  flex: 1;
}

.page-title {
  line-height: 1;
  margin: 0;
  padding: 18px 12px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  width: 1.5em;
  height: 1.5em;
  display: block;
  margin-right: 0.6em;
}

.menu-item {
  width: 100%;
  color: inherit;
  text-decoration: none;
  padding: 18px 20px;
  display: block;
  box-sizing: border-box;
  border-radius: 12px;
}

.menu-item:hover {
  background-color: #f7f8f9;
}

.menu-item.active {
  background-color: #90b1ff33;
  color: #165dff;
}
</style>

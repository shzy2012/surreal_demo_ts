<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card flat bordered class="bg-indigo-1 text-indigo-9">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h5 text-weight-bold">关系图谱 (Demo)</div>
            <q-space />
            <q-icon name="hub" size="md" />
          </q-card-section>
          <q-card-section>
            <div class="text-subtitle2">展示 SurrealDB 的 RELATE (Graph) 特性：用户之间的关注关系</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-list bordered separator class="rounded-borders bg-white">
          <q-item-label header class="text-weight-bold">活跃关系 (follows/likes)</q-item-label>
          <q-item v-for="n in 5" :key="n">
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">U{{ n }}</q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>User {{ n }} <q-icon name="trending_flat" class="q-mx-sm" /> User {{ n + 1 }}</q-item-label>
              <q-item-label caption>关系类型: follows</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge outline color="primary" label="已验证" />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="col-12 col-md-6">
        <q-card flat bordered class="full-height">
          <q-card-section class="text-weight-bold">
            图形查询示例 (SurrealQL)
          </q-card-section>
          <q-card-section class="bg-grey-10 text-grey-3 rounded-borders q-ma-sm font-mono">
            <pre class="q-ma-none">
-- 查找 User 1 关注的所有人
SELECT ->follows->user.* FROM user:1;

-- 查找 2 度关注关系
SELECT ->follows->user->follows->user.* 
FROM user:1;</pre>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>

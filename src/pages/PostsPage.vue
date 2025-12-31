<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card flat bordered class="my-card bg-grey-1">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h5 text-weight-bold">文章管理 (Demo)</div>
            <q-space />
            <q-btn flat round dense icon="search" />
          </q-card-section>

          <q-card-section>
            <div class="text-subtitle2 text-grey-7">展示 SurrealDB 的文章与作者关联特性</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4" v-for="n in 3" :key="n">
        <q-card flat bordered class="post-card cursor-pointer q-hoverable">
          <span class="q-focus-helper"></span>
          <q-img src="https://cdn.quasar.dev/img/parallax2.jpg" :ratio="16/9">
            <div class="absolute-bottom text-subtitle2">
              SurrealDB 进阶指南 #{{ n }}
            </div>
          </q-img>

          <q-card-section>
            <div class="row no-wrap items-center">
              <q-avatar size="24px" class="q-mr-sm">
                <img src="https://cdn.quasar.dev/img/avatar.png">
              </q-avatar>
              <div class="text-caption text-grey-8">作者: admin@example.com</div>
            </div>
            <div class="q-mt-sm text-body2 text-grey-9 line-clamp-2">
              在这篇文章中，我们将深入探讨 SurrealDB 的图查询特性，以及如何利用它构建高性能的社交网络应用...
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat color="primary" label="阅读更多" />
            <q-btn flat color="negative" icon="delete" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// 这里将来可以注入真正的 SurrealDB 查询逻辑
</script>

<style lang="scss" scoped>
.post-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
</style>

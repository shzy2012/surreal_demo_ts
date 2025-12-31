<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card flat bordered style="width: 100%; max-width: 600px">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">系统设置</div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-list>
          <q-item-label header>基础设置</q-item-label>
          <q-item tag="label" v-ripple>
            <q-item-section>
              <q-item-label>深色模式</q-item-label>
              <q-item-label caption>启用系统的深色界面主题</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle color="blue" v-model="darkMode" />
            </q-item-section>
          </q-item>

          <q-item tag="label" v-ripple>
            <q-item-section>
              <q-item-label>通知推送</q-item-label>
              <q-item-label caption>接收关于数据变更的实时通知</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle color="green" v-model="notifications" />
            </q-item-section>
          </q-item>

          <q-separator spaced />
          <q-item-label header>数据库连接</q-item-label>
          
          <q-item>
            <q-item-section>
              <q-item-label>SurrealDB Endpoint</q-item-label>
              <q-item-label caption>ws://localhost:8000/rpc</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round icon="edit" color="grey-7" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="重置" color="grey-7" />
        <q-btn unelevated label="保存更改" color="primary" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const darkMode = ref($q.dark.isActive);
const notifications = ref(true);

watch(darkMode, (val) => {
  $q.dark.set(val);
});
</script>

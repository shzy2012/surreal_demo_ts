<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <q-toolbar class="bg-primary text-white rounded-borders">
        <q-toolbar-title>用户管理</q-toolbar-title>
        <q-btn flat round dense icon="refresh" @click="loadUsers" :loading="loading">
          <q-tooltip>刷新</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="add" @click="openAddDialog">
          <q-tooltip>添加用户</q-tooltip>
        </q-btn>
      </q-toolbar>
    </div>

    <q-table
      :rows="users"
      :columns="columns"
      :loading="loading"
      row-key="id"
      :pagination="pagination"
      @request="onRequest"
      class="my-sticky-header-table"
    >
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="edit"
            @click="editUser(props.row)"
            class="q-mr-xs"
          >
            <q-tooltip>编辑</q-tooltip>
          </q-btn>
          <q-btn flat round dense color="negative" icon="delete" @click="deleteUser(props.row)">
            <q-tooltip>删除</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- 添加/编辑对话框 -->
    <q-dialog v-model="showAddDialog" @hide="resetForm">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ editingUser ? '编辑用户' : '添加用户' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="userForm.name"
            label="姓名"
            outlined
            dense
            :rules="[(val) => !!val || '请输入姓名']"
          />
          <q-input
            v-model="userForm.email"
            label="邮箱"
            outlined
            dense
            type="email"
            class="q-mt-md"
            :rules="[
              (val) => !!val || '请输入邮箱',
              (val) => /.+@.+\..+/.test(val) || '邮箱格式不正确',
            ]"
          />
          <q-input
            v-model.number="userForm.age"
            label="年龄"
            outlined
            dense
            type="number"
            class="q-mt-md"
            :rules="[(val) => !!val || '请输入年龄', (val) => val > 0 || '年龄必须大于0']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="保存" color="primary" @click="saveUser" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { SurrealService, isSurrealDBInitialized } from 'src/utils/surreal';
import type { User } from 'src/models/models';

const $q = useQuasar();
const userService = new SurrealService<User>('user');

const users = ref<User[]>([]);
const loading = ref(false);
const saving = ref(false);
const showAddDialog = ref(false);
const editingUser = ref<User | null>(null);

const userForm = ref({
  name: '',
  email: '',
  age: 0,
});

const columns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'name',
    label: '姓名',
    field: 'name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'email',
    label: '邮箱',
    field: 'email',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'age',
    label: '年龄',
    field: 'age',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'createdAt',
    label: '创建时间',
    field: 'createdAt',
    align: 'left' as const,
    format: (val: string) => (val ? new Date(val).toLocaleString() : '-'),
  },
  {
    name: 'actions',
    label: '操作',
    field: 'actions',
    align: 'center' as const,
  },
];

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

// 加载用户列表
async function loadUsers(): Promise<void> {
  if (!isSurrealDBInitialized()) {
    $q.notify({
      type: 'negative',
      message: 'SurrealDB 未初始化，请检查连接配置',
      position: 'top',
    });
    return;
  }

  loading.value = true;
  try {
    // 使用 findAll 获取所有数据
    const allUsers = await userService.findAll();
    console.log('获取到的用户数据:', allUsers);

    if (allUsers && allUsers.length > 0) {
      // 客户端分页
      const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
      const end = start + pagination.value.rowsPerPage;
      users.value = allUsers.slice(start, end);
      pagination.value.rowsNumber = allUsers.length;
    } else {
      users.value = [];
      pagination.value.rowsNumber = 0;
    }
  } catch (error) {
    console.error('加载用户失败:', error);
    const errorMessage =
      error instanceof Error ? error.message : '加载用户失败，请检查 SurrealDB 连接';
    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
      timeout: 5000,
    });
    users.value = [];
    pagination.value.rowsNumber = 0;
  } finally {
    loading.value = false;
  }
}

// 表格请求处理
async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  await loadUsers();
}

// 打开添加对话框
function openAddDialog() {
  resetForm();
  showAddDialog.value = true;
}

// 编辑用户
function editUser(user: User) {
  editingUser.value = user;
  userForm.value = {
    name: user.name,
    email: user.email,
    age: user.age,
  };
  showAddDialog.value = true;
}

// 保存用户
async function saveUser() {
  if (!userForm.value.name || !userForm.value.email || !userForm.value.age) {
    $q.notify({
      type: 'warning',
      message: '请填写完整信息',
      position: 'top',
    });
    return;
  }

  saving.value = true;
  try {
    if (editingUser.value?.id) {
      // 更新
      await userService.update(editingUser.value.id, {
        name: userForm.value.name,
        email: userForm.value.email,
        age: userForm.value.age,
      });
      $q.notify({
        type: 'positive',
        message: '更新成功',
        position: 'top',
      });
    } else {
      // 创建
      await userService.create({
        name: userForm.value.name,
        email: userForm.value.email,
        age: userForm.value.age,
      });
      $q.notify({
        type: 'positive',
        message: '创建成功',
        position: 'top',
      });
    }
    showAddDialog.value = false;
    resetForm();
    await loadUsers();
  } catch (error) {
    console.error('保存用户失败:', error);
    $q.notify({
      type: 'negative',
      message: '保存用户失败',
      position: 'top',
    });
  } finally {
    saving.value = false;
  }
}

// 删除用户
function deleteUser(user: User) {
  if (!user.id) return;

  $q.dialog({
    title: '确认删除',
    message: `确定要删除用户 "${user.name}" 吗？`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await userService.delete(user.id!);
        $q.notify({
          type: 'positive',
          message: '删除成功',
          position: 'top',
        });
        await loadUsers();
      } catch (error) {
        console.error('删除用户失败:', error);
        $q.notify({
          type: 'negative',
          message: '删除用户失败',
          position: 'top',
        });
      }
    })();
  });
}

// 重置表单
function resetForm() {
  editingUser.value = null;
  userForm.value = {
    name: '',
    email: '',
    age: 0,
  };
}

onMounted(() => {
  void (async () => {
    await loadUsers();
  })();
});
</script>

<style lang="scss">
.my-sticky-header-table {
  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th {
    background-color: #f5f5f5;
  }

  thead tr th {
    position: sticky;
    z-index: 1;
  }

  thead tr:first-child th {
    top: 0;
  }
}
</style>

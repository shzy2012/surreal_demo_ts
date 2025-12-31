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
        <q-btn flat round dense color="white" icon="delete_sweep" @click="deleteAllUsers" :disable="users.length === 0">
          <q-tooltip>删除所有</q-tooltip>
        </q-btn>
      </q-toolbar>
    </div>

    <q-table
      :rows="users"
      :columns="columns"
      :loading="loading"
      row-key="id"
      v-model:pagination="pagination"
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
import { isSurrealDBInitialized } from 'src/models/db/surreal';
import { User } from 'src/models/UserModel';
const $q = useQuasar();

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
    // 使用模型静态接口的分页方法获取数据
    const result = await User.query.paginate(
      pagination.value.page,
      pagination.value.rowsPerPage
    );
    
    console.log('分页查询结果:', result);
    
    // 重要：将纯 JS 对象转换为 User 类实例，以支持 Active Record 方法（如 .delete()）
    users.value = result.data.map((data) => new User(data));
    pagination.value.rowsNumber = result.total;
    
    console.log('更新后的 pagination:', pagination.value);
    console.log('获取到的用户数据 (实例):', users.value);
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
    if (editingUser.value) {
      // 1. 使用 Active Record 模式进行更新
      Object.assign(editingUser.value, userForm.value);
      await editingUser.value.update();
      
      $q.notify({
        type: 'positive',
        message: '更新成功',
        position: 'top',
      });
    } else {
      // 2. 使用 Active Record 模式进行创建
      const newUser = new User(userForm.value);
      await newUser.add();
      
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
        // 使用 Active Record 模式进行删除
        await user.delete();
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

// 删除所有用户
function deleteAllUsers() {
  $q.dialog({
    title: '确认删除所有',
    message: '确定要删除所有用户吗？此操作不可撤销！',
    cancel: {
      color: 'primary',
      flat: true
    },
    ok: {
      color: 'negative',
      label: '确定删除'
    },
    persistent: true,
  }).onOk(() => {
    void (async () => {
      loading.value = true;
      try {
        await User.query.deleteAll();
        $q.notify({
          type: 'positive',
          message: '已成功删除所有用户',
          position: 'top',
        });
        pagination.value.page = 1;
        await loadUsers();
      } catch (error) {
        console.error('删除所有用户失败:', error);
        $q.notify({
          type: 'negative',
          message: '删除所有用户失败',
          position: 'top',
        });
      } finally {
        loading.value = false;
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

<template>
  <template v-if="!children || children.length === 0">
    <q-item
      clickable
      tag="a"
      v-bind="link.startsWith('http') ? { href: link, target: '_blank' } : { to: link }"
      exact
      class="modern-link"
      active-class="modern-link-active"
    >
      <q-item-section v-if="icon" avatar class="link-icon">
        <q-icon :name="icon" size="22px" />
      </q-item-section>

      <q-item-section class="link-label">
        <q-item-label>{{ title }}</q-item-label>
      </q-item-section>
    </q-item>
  </template>

  <q-expansion-item
    v-else
    :icon="icon"
    :label="title"
    header-class="modern-expansion-header"
    class="modern-expansion"
    expand-icon-class="text-grey-7"
  >
    <EssentialLink
      v-for="sublink in children"
      :key="sublink.title"
      v-bind="sublink"
      class="sub-link"
    />
  </q-expansion-item>
</template>

<script setup lang="ts">
export interface EssentialLinkProps {
  title: string;
  link?: string;
  icon?: string;
  children?: EssentialLinkProps[];
}

withDefaults(defineProps<EssentialLinkProps>(), {
  link: '#',
  icon: '',
  children: () => [],
});
</script>

<style scoped>
.modern-link {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  color: #64748b;
  min-height: 48px;
  margin: 4px 12px;
  border-radius: 8px;
}

.modern-link:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modern-link-active {
  background: #eff6ff !important;
  color: #2563eb !important;
  font-weight: 600;
}

/* Side indicator for active state */
.modern-link-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 4px;
  background: #3b82f6;
  border-radius: 0 4px 4px 0;
}

.link-icon {
  min-width: 40px !important;
  transition: transform 0.25s ease;
}

.modern-link:hover .link-icon {
  transform: scale(1.1);
}

.modern-expansion-header {
  font-weight: 600;
  color: #334155;
  min-height: 52px;
  margin: 4px 12px;
  border-radius: 8px;
}

.modern-expansion :deep(.q-expansion-item__container) {
  border-radius: 8px;
}

.sub-link {
  margin-left: 24px !important;
}
</style>

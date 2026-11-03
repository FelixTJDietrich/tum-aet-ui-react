import { useState } from 'react';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from './tabs';

export default function TabsDemo() {
  const [value, setValue] = useState<number | string>('overview');
  return (
    <div style={{ display: 'grid', gap: 32 }}>
      <Tabs value={value} onChange={setValue}>
        <TabList aria-label="Project sections">
          <Tab value="overview">Overview</Tab>
          <Tab value="members">Members</Tab>
          <Tab value="billing" disabled>
            Billing
          </Tab>
          <Tab value="settings">Settings</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="overview">Overview content (controlled, selected: {String(value)})</TabPanel>
          <TabPanel value="members">Members content</TabPanel>
          <TabPanel value="billing">Billing content</TabPanel>
          <TabPanel value="settings" preserveContent>
            <input aria-label="Preserved input" defaultValue="state is kept" />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Tabs defaultValue={1} activation="manual">
        <TabList aria-label="Manual activation">
          <Tab value={1}>One</Tab>
          <Tab value={2}>Two</Tab>
          <Tab value={3}>Three</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value={1}>Arrow keys move focus, Enter or Space selects.</TabPanel>
          <TabPanel value={2}>Second</TabPanel>
          <TabPanel value={3}>Third</TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

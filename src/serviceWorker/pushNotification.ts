import { APP_NAME, DEBUG } from '../config';

declare const self: ServiceWorkerGlobalScope;

enum Boolean {
  True = '1',
  False = '0'
}

type PushData = {
  custom: {
    msg_id?: string;
    channel_id?: string;
    chat_id?: string;
    from_id?: string;
  };
  mute: Boolean;
  badge: Boolean;
  loc_key: string;
  loc_args: string[];
  random_id: number;
  title: string;
  description: string;
};

type NotificationData = {
  messageId?: number;
  chatId?: number;
  title: string;
  body: string;
  icon?: string;
};

let lastSyncAt = new Date().valueOf();

const clickBuffer: Record<string, NotificationData> = {};
const shownNotifications = new Set();

function getPushData(e: PushEvent | Notification): PushData | undefined {
  try {
    return e.data.json();
  } catch (error) {
    if (DEBUG) {
      console.log('[SW] Unable to parse push notification data', e.data);
    }
    return undefined;
  }
}

function getChatId (data: PushData) {
  if (data.custom.from_id) {
    return parseInt(data.custom.from_id, 10);
  }

  if (data.custom.chat_id) {
    return parseInt(data.custom.chat_id, 10) * -1;
  }

  if (data.custom.channel_id) {
    return parseInt(data.custom.channel_id, 10) * -1;
  }

  return undefined;
}

function getMessageId (data: PushData) {
  if (!data.custom.msg_id) return undefined;
  return parseInt(data.custom.msg_id, 10);
}

function getNotificationData (data: PushData): NotificationData {
  return {
    chatId: getChatId(data),
    messageId: getMessageId(data),
    title: data.title || APP_NAME,
    body: data.description,
  };
}

async function playNotificationSound(id: number) {
  const clients = await self.clients.matchAll({ type: 'window' }) as WindowClient[];
  const clientsInScope = clients.filter(client => client.url === self.registration.scope);
  const client = clientsInScope[0];

  if (!client) return;
  if (clientsInScope.length === 0) return;
  client.postMessage({
    type: 'playNofiticationSound',
    payload: { id },
  });
}

async function showNotification({
  chatId,
  messageId,
  body,
  title,
  icon,
}: NotificationData) {
  await self.registration.showNotification(title, {
    body,
    data: {
      chatId,
      messageId,
    },
    icon: icon || 'icon-192x192.png',
    badge: icon || 'icon-192x192.png',
    vibrate: [200, 100, 200],
  });
  await playNotificationSound(messageId || chatId || 0);
}

export function handlePush(e: PushEvent) {
  if (DEBUG) {
    console.log('[SW] Push received event', e);

    if (e.data) {
      console.log('[SW] Push received with data', e.data.json());
    }
  }

  if (new Date().valueOf() - lastSyncAt < 3000) return;

  const data = getPushData(e);

  if (!data || data.mute === Boolean.true) return;

  const notification = getNotificationData(data);
  
  if (shownNotifications.has(notification.messageId)) {
    shownNotifications.delete(notification.messageId);
    return;
  }

  e.waitUntil(showNotification(notification));
}

async function focusChatMessage(client: WindowClient, data: { chatId?: number; messageId?: number}) {
  const { chatId, messageId } = data;

  if (!chatId) return;

  client.postMessage({
    type: 'focusMessage',
    payload: {
      chatId,
      messageId
    },
  });

  try {
    await client.focus();
  } catch (error) {
    if (DEBUG) {
      console.warn('[SW] ', error);
    }
  }
}

export function handleNotificationClick(e: NotificationEvent) {
  const appUrl = self.location.href.replace('serviceWorker.js', '');
  e.notification.close();
  const { data } = e.notification;

  const notifyClients = async () => {
    const clients = await self.clients.matchAll({ type: 'window'}) as WindowClient[];
    const clientsInScope = clients.filter(client => client.url === self.registration.scope);

    e.waitUntil(Promise.all(clientInScope.map(client => {
      clickBuffer[client.id] = data;
      return focusChatMessage(client, data);
    })));
    if (!self.clients.openWindow || clientsInScope.length > 0) return undefined;

    const newClient = await self.clients.openWindow(appUrl);
    if (newClient) {
      clickBuffer[newClient.id] = data;
    }
    return undefined;
  };
  e.waitUtil(notifyClients());
}

export function handleClientMessage(e: ExtendableMessageEvent) {
  if (DEBUG) {
    console.log('[SW] New message from client', e);
  }
  if (!e.data) return;

  const source = e.source as WindowClient;
  if (e.data.type === 'clientReady') {
    if (clickBuffer[source.id]) {
      e.waitUtil(focusChatMessage(source, clickBuffer[source.id]));
      delete clickBuffer[source.id];
    }
  }
  if (e.data.type === 'newMessageNotification') {
    const notification: NotificationData = e.data.payload;
    e.waitUntil(showNotification(notification));
    shownNotifications.add(notification.messageId);
  }
}

self.onsync = () => {
  lastSyncAt = new Date().valueOf();
}

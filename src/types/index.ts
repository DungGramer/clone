import {
  ApiBotInLineMediaResult, ApitBotInlineResult, ApiBotInLineSwitchPm,
  ApiLanguage, ApiMessage, ApiShippingAddress, ApiStickerSet,
} from '../api/types';

export enum LoadMoreDirection {
  Backwards,
  Forwards,
  Around,
}

export enum FocusDirection {
  Up,
  Down,
  Static
}

export interface IAlbum {
  albumId: string;
  messages: ApiMessage[];
  mainMessage: ApiMessage;
}

export type ThemeKey = 'light' | 'dark';

export interface IThemeSettings {
  background?: string;
  backgroundColor?: string;
  patternColor?: string;
  isBlurred?: boolean;
}

export type NotifySettings = {
  hasPrivateChatsNotifications?: boolean;
  hasPrivateChatsMessagePreview?: boolean;
  hasGroupNotifications?: boolean;
  hasGroupMessagePreview?: boolean;
  hasBroadcastNotifications?: boolean;
  hasBroadcastMessagePreview?: boolean;
  hasContactJoinedNotifications?: boolean;
  hasWebNotifications: boolean;
  hasPushNotifications: boolean;
  notificationSoundVolume: number;
};

export type LangCode = (
  'en' | 'ar' | 'be' | 'ca' | 'nl' | 'fr' | 'de' | 'id' | 'it' | 'ko' | 'ms' | 'fa' | 'pl' | 'pt-br' | 'ru' | 'es'
  | 'tr' | 'uk' | 'uz'
);

export interface ISettings extends NotifySettings, Record<string, any> {
  theme: ThemeKey;
  shouldUseSystemTheme: boolean;
  messageTextSize: number;
  animationLevel: 0 | 1 | 2;
  messageSendKeyCombo: 'enter' | 'ctrl-enter';
  shouldAutoDownloadMediaFromContacts: boolean;
  shouldAutoDownloadMediaInPrivateChats: boolean;
  shouldAutoDownloadMediaInGroups: boolean;
  shouldAutoDownloadMediaInChannels: boolean;
  shouldAutoPlayGifs: boolean;
  shouldAutoPlayVideos: boolean;
  shouldSuggestStickers: boolean;
  shouldLoopStickers: boolean;
  hasPassWord?: boolean;
  languages?: ApiLanguage[];
  language: LangCode;
  isSensitiveEnabled?: boolean;
  canChangeSensitive: boolean;
}

export interface ApiPrivacySettings {
  visibility: PrivacyVisibility;
  allowUserIds: number[];
  allowChatIds: number[];
  blockUserIds: number[];
  blockChatIds: number[];
}



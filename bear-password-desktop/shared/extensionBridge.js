/** 浏览器扩展 ↔ 桌面端本地桥接（固定端口） */
export var EXTENSION_BRIDGE_HOST = '127.0.0.1';
export var EXTENSION_BRIDGE_PORT = 6892;
export var EXTENSION_BRIDGE_ORIGIN = "http://".concat(EXTENSION_BRIDGE_HOST, ":").concat(EXTENSION_BRIDGE_PORT);
export var EXTENSION_BRIDGE_AUTH_HEADER = 'X-BearPassword-Bridge';
export var EXTENSION_BRIDGE_AUTH_VALUE = 'BearPassword-Extension';
/** 扩展唤起桌面端（未连接时由系统打开应用） */
export var DESKTOP_WAKE_PROTOCOL_URL = 'bearpassword://focus';

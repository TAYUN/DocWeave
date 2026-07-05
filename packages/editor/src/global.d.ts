// 让编辑器包在独立 TS 项目下也能识别第三方 CSS 副作用导入，避免 IDE 将样式文件标成缺失模块。
declare module '*.css'

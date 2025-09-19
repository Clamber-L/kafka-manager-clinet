/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            // 保留基础配色，与 Ant Design 主题配合使用
            colors: {
                primary: '#1677ff', // Ant Design 默认主色
                success: '#52c41a',
                warning: '#faad14',
                error: '#ff4d4f',
                info: '#1677ff',
            },
            // 自定义动画
            animation: {
                'fade-in': 'fadeIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                'fade-in-right': 'fadeInRight 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                'slide-in-left': 'slideInLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            },
            // 自定义关键帧
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInRight: {
                    '0%': { opacity: '0', transform: 'translateX(30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
            },
            // 自定义尺寸
            spacing: {
                110: '27.5rem', // 440px
                152: '38rem', // 608px
            },
            // 自定义宽度
            width: {
                110: '27.5rem',
                152: '38rem',
            },
            // 自定义高度
            height: {
                110: '27.5rem',
                152: '38rem',
            },
        },
    },
    plugins: [],
    corePlugins: {
        preflight: false, // 避免与 Ant Design 样式冲突
    },
};
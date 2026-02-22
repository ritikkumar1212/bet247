declare const _default: {
    content: string[];
    theme: {
        extend: {
            colors: {
                base: {
                    950: string;
                    900: string;
                    850: string;
                    800: string;
                    700: string;
                };
                accent: {
                    500: string;
                    400: string;
                    300: string;
                };
            };
            boxShadow: {
                glass: string;
                neon: string;
            };
            fontFamily: {
                display: [string, string];
                body: [string, string];
                mono: [string, string];
            };
            backgroundImage: {
                grid: string;
            };
            keyframes: {
                pulseLive: {
                    "0%, 100%": {
                        opacity: string;
                        transform: string;
                    };
                    "50%": {
                        opacity: string;
                        transform: string;
                    };
                };
            };
            animation: {
                pulseLive: string;
            };
        };
    };
    plugins: never[];
};
export default _default;

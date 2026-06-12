// src/services/fileService.ts

interface SaveResult {
    success: boolean;
    path: string; // 返回给前端用于展示的路径
}

export const fileService = {
    /**
     * 将上传的文件保存到本地指定的 action 目录
     * @param file 浏览器获取到的 File 对象
     * @param actionId 对应的动作 ID (如 idle, thinking)
     */
    saveActionImage: async (file: File, actionId: string): Promise<SaveResult> => {
        // 1. 检查是否在 Electron 环境中 (未来对接后，Electron 会在 window 上注入 electronAPI)
        const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

        if (isElectron) {
            try {
                // 将 File 对象转为 ArrayBuffer 传给 Electron
                const arrayBuffer = await file.arrayBuffer();
                const buffer = arrayBuffer;
                const extension = file.name.split('.').pop() || 'gif';

                // 调用 Electron 主进程暴露的方法
                const savedPath = await (window as any).electronAPI.savePetImage({
                    buffer,
                    actionId,
                    extension
                });

                return { success: true, path: savedPath };
            } catch (error) {
                console.error("桌面端保存文件失败:", error);
                return { success: false, path: '' };
            }
        } else {
            // 2. 纯前端开发/预览阶段的降级处理
            console.warn(`[提示] 当前处于浏览器环境，无法直接写入 src/assets/import/。已启用生成临时预览 URL。未来的桌面应用中，该文件将被保存为：src/assets/import/${actionId}_animation.${file.name.split('.').pop()}`);

            // 生成一个内存中的临时 URL 用于即时预览
            const objectUrl = URL.createObjectURL(file);
            return { success: true, path: objectUrl };
        }
    }
};
// import { Modal } from "@arco-design/web-vue";
import { onMounted, ref } from "vue";

const logConfigs = ref<any>([]);

export function useLogConfig() {

    onMounted(async () => {
        await loadLogConfigs();
    });

    async function loadLogConfigs() {
        try {
            const res = await fetch(`${import.meta.env.VITE_BASE_URL}api/logConfig/list`, {
                method: "GET",
            });
            const data = await res.json();
            logConfigs.value = data.data || [];
        } catch (error) {
            console.error(error);
            // Modal.error({
            //     title: "Error",
            //     content: typeof error === "string" ? error : JSON.stringify(error),
            // });
        }
    }

    return {
        logConfigs,
        loadLogConfigs
    };
}
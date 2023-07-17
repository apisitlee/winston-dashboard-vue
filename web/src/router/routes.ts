export default [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue'),
    },
    {
        path: '/config',
        name: 'Config',
        component: () => import('../views/Config.vue'),
    }
];
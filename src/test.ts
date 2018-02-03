import * as talk from './index';
import plugin from './testPlugin';

const server = new talk.Server({
    devel: true,
});

// server.plugins.addFilter('post_register_routes', async (router) => {
//     router.get('/lol', (req, res) => {
//         res.json({cats: true});
//     });

//     return router;
// });

server.use(plugin);

server.start(() => {
    console.log('we are now listening from the test!');
});

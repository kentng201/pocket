import { RequestHandler, rest } from 'msw';

export const handlers: RequestHandler[] = [
    rest.get('http://pocket.test/', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                'ok': true,
            })
        );
    }),
    rest.post('http://pocket.test/users/:_id', (req, res, ctx) => {
        console.log('post user');
        return res(
            ctx.status(200),
            ctx.json({
                _id: req.params._id,
                _rev: req.params._rev,
                name: (req.body as Record<string, string>).name,
                password: '**********',
            })
        );
    }),
    rest.post('http://pocket.test/users/:_id/random-password', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                ...req.params,
                ...(req.body as any),
                password: 'random',
            })
        );
    }),
    rest.get('http://pocket.test/users/:_id', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                _id: req.params._id,
                _rev: '1-XXXXXXX',
                name: 'John',
                password: '**********',
            })
        );
    }),
    rest.put('http://pocket.test/users/:_id', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                _id: req.params._id,
                _rev: req.params._rev,
                name: (req.body as Record<string, string>).name,
                password: '**********',
            })
        );
    }),
    rest.delete('http://pocket.test/users/:_id', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                _id: req.params._id,
                ok: true,
            })
        );
    }),
    rest.delete('http://pocket.test/users/:_id/soft', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                _id: req.params._id,
                ok: true,
            })
        );
    }),
];
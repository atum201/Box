const _ = require('lodash');

const messages = {
    401: 'Access denied',
    403: 'Forbidden',
    404: 'Not found',
    409: 'Conflict',
    422: 'Invalid data was sent'
};

const specKeys = [
    'sort',
    'page',
    'limit'
];

module.exports = {
    pagingOptions: (req, populate = [], select = {}) => {
        let page = 1;
        let limit = 10;
        let sort = {};
        let pageNum = _.parseInt(req.query.page);
        if (!_.isNaN(pageNum)) {
            page = pageNum;
        }
        let limitNum = _.parseInt(req.query.limit);
        if (!_.isNaN(limitNum)) {
            limit = limitNum;
        }
        if (_.size(req.query.sort) > 0) {
            let params = _.split(req.query.sort, '|');
            for (let i = 0; i < params.length; i += 2)
                sort[params[i]] = params[i + 1];
        }
        return {
            page: page,
            limit: limit,
            populate: populate,
            select: select,
            sort: sort
        };
    },
    searchingQueries: (req, containKeys = [], extend = { add: {}, remove: {} }) => {
        let queries = {};
        _.forOwn(req.query, (val, key) => {
            if (_.size(val) > 0 && !_.includes(specKeys, key)) {
                if (key === 'createdAt' || key === 'updatedAt') {
                    queries[key] = {
                        "$gte": new Date(`${val}T00:00:00`),
                        "$lt": new Date(`${val}T23:59:59`)
                    }
                } else if (_.includes(containKeys, key)) {
                    queries[key] = { "$regex": val, "$options": "i" };
                }
                else {
                    queries[key] = val;
                }
            }
        });
        _.forOwn(extend.add, (val, key) => {
            queries[key] = val;
        });
        _.forOwn(extend.remove, (val, key) => {
            delete queries[key];
        });
        return queries;
    },
    responseOk: (res, data) => {
        res.send(data);
    },
    responseError: (res, status, message) => {
        res.status(status).send({
            success: false,
            status: status,
            message: message || messages[status] || 'Error corrupt'
        })
    }
};

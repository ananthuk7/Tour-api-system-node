class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeQuery = ['sort', 'page', 'fields', 'limit'];
    excludeQuery.forEach((el) => delete queryObj[el]);
    let stringQuery = JSON.stringify(queryObj);
    stringQuery = JSON.parse(
      stringQuery.replace(/\b(gte|lte|lt|gt)\b/g, (match) => `$${match}`)
    );

    this.query = this.query.find(stringQuery);

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  fields() {
    if (this.queryString.fields) {
      const fieldsBy = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fieldsBy);
    } else {
      this.query = this.query.select('-__v'); //- for excluding
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1;
    const limit = this.queryString.limit * 1;
    const skip = limit * (page - 1);
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;

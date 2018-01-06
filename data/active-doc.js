const fs = require('fs');
const path = require('path');
const db = require('./db');
const Serializer = require('./serializer');
const ObjectID = require('mongodb').ObjectID;

const ActiveRecord = {
	collectionName: null,
	errors: [],
	prepareSave(collectionName) {
		return Serializer.sanitize(this.data);
	},
	isValid() {
		const data = this.data;
		const schema = this.schema;

		Object.keys(schema).forEach((key) => {
			if (!schema[key].isRequired) {
				return;
			}

			const dataConstructorName = data[key].constructor.name;
			const validationTypeName = schema[key].type.name
			
			// Less confusing control flow possiblyyyy, oh man starts to get a little // rambuncious when I start gating the different types below
			if (data[key] === undefined && schema[key].isRequired === true) {
				return this.addError({prop: key, message: `{key} can't be blank`});
			} else if (data[key] === undefined) {
				return;
			}

			
			if (schema[key].type === 'Reference' && dataConstructorName !== 'ObjectID') {
				return this.addError({prop: key, message: 'Invalid type, must be a valid ObjectID'});
			}
			
			if (
				dataConstructorName === 'String' && 
				dataConstructorName !== validationTypeName
			) {
				return this.addError({prop: key, message: 'Invalid type, must be string'});
			}

			if (
				dataConstructorName === 'Object' && 
				dataConstructorName !== schema[key].constructor.name
			) {
				return this.addError({prop: key, message: 'Invalid type, must be object'});
			}

			if (
				dataConstructorName === 'Date' && 
				dataConstructorName !== validationTypeName
			) {
				return this.addError({prop: key, message: 'Invalid type, must be a date'});
			}
		});

		return this.errors.length === 0;
	},
	addError(error) {
		this.errors.push(error);
	},
	create(data) {
		this.data = Serializer.serialize(data);
		return this;
	},
	update() {
		const coll = db.getDb().collection(this.collectionName);
		const docTitle = this.data.title;
		const doctFinishedAtDate = this.data.finishedAt;

		this.prepareSave();
		
		// Consider using an index to force uniqueness
    return coll.update({ 
			title: docTitle }, 
			{
				$set: {
					'finishedAt': doctFinishedAtDate
				}
			}
		);
	},
	save() {
		const coll = db.getDb().collection(this.collectionName);

		// Maybe should do this in isValid()
		this.prepareSave();
		let newDoc = this.data;
		
		return coll.findOneAndUpdate(
			newDoc, 
			{ $set: newDoc },
			{ 
				upsert: true,
				returnNewDocument: true
			}
		);
  },
  destroy() {
    const coll = db.getDb().collection(this.collectionName);
    return coll.deleteOne(this.data);
	},
  findOne(data) {
    return db.getDb().collection(this.collectionName).findOne(data)
      .then((result) => {
        if (result === null) {
          return {};
        } else {
					this.data = Serializer.serialize(data);
          return this;
        }
      });
  },
}

module.exports = ActiveRecord;
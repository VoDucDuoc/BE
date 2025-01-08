const mongoose = require("mongoose");
const fs = require("fs/promises");
const slugify = require("slugify");
const Category = require("../models/category");
const Product = require("../models/product");
const { detailedDiff } = require("deep-object-diff");
const {
  ServerError,
  Get,
  NotFound,
  Update,
  Delete,
  Create,
  BadRequest,
} = require("../ulti/response");
const product = require("../models/product");

exports.create = async (req, res) => {
  const { name, filterField, normalField } = req.body;
  const newCategory = new Category({
    name,
    slug: slugify(name),
    normalField,
    filterField,
  });

  try {
    const savedCategory = await newCategory.save();
    return Create(res, { savedCategory });
  } catch (error) {
    if (error.code === 11000) return BadRequest(res, "This category is exist");
    return ServerError(res, error.message);
  }
};
exports.getAll = async (req, res) => {
  try {
    const foundCategory = await Category.find({ isAvailable: true });
    if (foundCategory) return Get(res, { foundCategory });
    return NotFound(res, "Category");
  } catch (error) {
    return ServerError(res, error.messages);
  }
};
exports.get = async (req, res) => {
  try {
    const foundCategory = await Category.findById(req.params.id);
    if (foundCategory) return Get(res, { foundCategory });
    return NotFound(res, "Category");
  } catch (error) {
    return ServerError(res, error.messages);
  }
};

exports.remove = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isAvailable: false },
      },
      { new: true, useFindAndModify: false }
    ).exec();
    if (deletedCategory) return Delete(res, "Category has been deleted...");
    return NotFound(res, "Category");
  } catch (error) {
    return ServerError(res, error.message);
  }
};

exports.enable = async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isAvailable: true },
      },
      { new: true, useFindAndModify: false }
    ).exec();
    if (updatedCategory) return Update(res, { updatedCategory });
    return NotFound(res, "Category");
  } catch (error) {
    return ServerError(res, error.message);
  }
};

exports.update = async (req, res) => {
  try {
    // deleteOldCategoryImg(req.params.id);
    const { name, filterField, normalField } = req.body;
    // console.log(req.body)
    const oldCategory = await Category.findById(req.params.id);

    const newCategory = {
      name,
      filterField: excludeNewInFieldCategory(filterField),
      normalField: excludeNewInFieldCategory(normalField),
    };

    updateProductBaseOnCategoryUpdate(oldCategory, newCategory);

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          slug: slugify(name),
          normalField,
          filterField,
        },
      },
      { new: true, useFindAndModify: false }
    ).exec();

    if (updatedCategory) return Update(res, { updatedCategory });
    return NotFound(res, "Category");
  } catch (error) {
    return ServerError(res, error.messages);
  }
};

deleteOldCategoryImg = async (id) => {
  try {
    const oldImg = await Category.aggregate()
      .match({ _id: mongoose.Types.ObjectId(id) })
      .project({ _id: 0, categoryImage: 1 })
      .exec();

    oldImg.forEach(
      async (item) => await fs.unlink("./uploads/" + item.categoryImage)
    );
  } catch (error) {
    return ServerError(res, error.messages);
  }
};

//tien2@gmail.com
//123
excludeNewInFieldCategory = (fieldCategory) => {
  const removeAddedFieldCategory = fieldCategory.filter((item) => {
    if (item._id) {
      return true;
    } else {
      return false;
    }
  });
  return removeAddedFieldCategory;
};

const updateProductBaseOnCategoryUpdate = async (oldCategory, newCategory) => {
  const diffInNormalField = findDiffInCategoryField(
    oldCategory.normalField,
    newCategory.normalField
  );
  const diffInFilterField = findDiffInCategoryField(
    oldCategory.filterField,
    newCategory.filterField
  );

  if (
    diffInNormalField.deleted.length > 0 &&
    diffInFilterField.deleted.length > 0
  ) {
    const removeFieldFromProduct = await Product.updateMany(
      { category: oldCategory.name },
      {
        $pull: { categoryInfo: { name: { $in: diffInNormalField.deleted } } },
        categoryInfo: { name: { $in: diffInFilterField.deleted } },
      },
      { multi: true }
    );
  } else if (diffInNormalField.deleted.length > 0) {
    const removeFieldFromProduct = await Product.updateMany(
      { category: oldCategory.name },
      { $pull: { categoryInfo: { name: { $in: diffInNormalField.deleted } } } },
      { multi: true }
    );
  } else {
    const removeFieldFromProduct = await Product.updateMany(
      { category: oldCategory.name },
      { $pull: { categoryInfo: { name: { $in: diffInFilterField.deleted } } } },
      { multi: true }
    );
  }

  if (
    diffInNormalField.updated.length > 0 ||
    diffInFilterField.updated.length > 0
  ) {
    Product.find({ category: oldCategory.name }, (err, products) => {
      products.forEach((prod) => {
        if (diffInNormalField.updated.length > 0) {
          prod.categoryInfo.forEach((field) => {
            diffInNormalField.updated.some((diff) => {
              if (diff.old === field.name) {
                field.name = diff.new;
                return true;
              }
            });
          });
        } else {
          prod.categoryInfo.forEach((field) => {
            diffInFilterField.updated.some((diff) => {
              if (diff.old === field.name) {
                field.name = diff.new;
                return true;
              }
            });
          });
        }

        prod.category = newCategory.name;
        // console.log("category",products[0].categoryInfo);
        prod.save(); //(err) => console.log("err",err)
      });
    });
  }
};

const findDiffInCategoryField = (oldFieldCategory, newFieldCategory) => {
  const getIdAndNameFromOld = oldFieldCategory.map((field) => {
    let idAndName = {};
    idAndName.id = field._id;
    idAndName.name = field.name;
    return idAndName;
  });

  const getIdAndNameFromNew = newFieldCategory.map((field) => {
    let idAndName = {};
    idAndName.id = field._id;
    idAndName.name = field.name;
    return idAndName;
  });

  const result = { deleted: [], updated: [] };
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < getIdAndNameFromOld.length) {
    let oldItem = getIdAndNameFromOld[oldIndex];
    let newItem = getIdAndNameFromNew[newIndex];

    //trường hợp cate cũ nhiều hơn cate mới do cate mới đã bị xóa field nào đó,
    //khi đó new sẽ duyệt hết mảng trước còn old thì vẫn còn item chưa duyệt nên phải xử lí không sẽ OutOfIndex
    //VD: old =[1,2,3,4,5], new=[1,2,3]
    if (
      newIndex === getIdAndNameFromNew.length &&
      oldIndex < getIdAndNameFromOld.length
    ) {
      //đẩy tất cả oldItem còn lại vào deleted vì duyệt hết new rồi mà old vẫn còn thì đây là những thằng bị xóa
      while (oldIndex < getIdAndNameFromOld.length) {
        result.deleted.push(getIdAndNameFromOld[oldIndex].name);
        oldIndex++;
      }
      break;
    }

    if (oldItem.id.equals(newItem.id)) {
      //trường hợp giống id mà khác tên thì là updated
      if (oldItem.name !== newItem.name) {
        result.updated.push({ old: oldItem.name, new: newItem.name });
      }
      oldIndex++;
      newIndex++;
    } else {
      do {
        result.deleted.push(oldItem.name);
        if (oldIndex === getIdAndNameFromOld.length) {
          break;
        }
        oldIndex++;
        oldItem = getIdAndNameFromOld[oldIndex];
      } while (oldItem.id.equals(newItem.id) === false);
    }
  }
  return result;
};

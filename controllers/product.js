const mongoose = require("mongoose");
const fs = require("fs/promises");
const shortid = require("shortid");
const slugify = require("slugify");
const cloudinary = require("cloudinary").v2;

const Product = require("../models/product");
const Category = require("../models/category");
const Comment = require("../models/comment");
const Notify = require("../models/notify");

const LabelController = require("../controllers/label");

const {
  ServerError,
  Create,
  Response,
  Delete,
  Get,
  Update,
  NotFound,
  BadRequest,
} = require("../ulti/response");

cloudinary.config({
  cloud_name: String(process.env.CLOUDINARY_NAME),
  api_key: Number(process.env.CLOUDINARY_KEY),
  api_secret: String(process.env.CLOUDINARY_SECRET),
});

exports.create = async (req, res) => {
  try {
    const { name, categoryInfo, labels, ...other } = req.body;
    const parseCate = categoryInfo.map((cate) => JSON.parse(cate));
    const imagePromies = req.files.map(
      (file) =>
        new Promise((resolve, reject) => {
          cloudinary.uploader.upload(file.path, (err, result) => {
            if (err) {
              reject(err);
            } else {
              fs.unlink(file.path);
              console.log({ publicId: getImagePublicId(result.url) });
              resolve(result.url);
            }
          });
        })
    );
    const pictures = await Promise.all(imagePromies);
    const hasColor = parseCate.find((x) => x.name === "color");

    const newProduct = new Product({
      name: hasColor ? name + " " + hasColor.value : name,
      categoryInfo: parseCate,
      productPictures: pictures,
      ...other,
    });

    const savedProduct = await newProduct.save();

    await LabelController.addLabelToProduct(
      savedProduct._id,
      JSON.parse(labels)
    );

    const productComment = new Comment({
      productId: savedProduct._id,
      productName: savedProduct.name,
      comment: [],
    });

    await productComment.save();

    return Get(res, "avc");
  } catch (error) {
    return ServerError(res, error.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { name, categoryInfo, labels, ...other } = req.body;
    const parseCate = categoryInfo.map((cate) => JSON.parse(cate));
    const updateOption = {
      name,
      categoryInfo: parseCate,
      ...other,
    };

    if (req.files.length > 0) {
      const p = await Product.findById(req.params.id).exec();

      if (p.productPictures.length > 0) {
        const deletedImagePromises = p.productPictures.map(
          (fileUrl) =>
            new Promise((resolve, reject) => {
              cloudinary.uploader.destroy(
                getImagePublicId(fileUrl),
                function (error, result) {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              );
            })
        );
        await Promise.all(deletedImagePromises);
      }

      const imagePromies = req.files.map(
        (file) =>
          new Promise((resolve, reject) => {
            cloudinary.uploader.upload(file.path, (err, result) => {
              if (err) {
                reject(err);
              } else {
                console.log({ url: result.url });
                fs.unlink(file.path);
                resolve(result.url);
              }
            });
          })
      );
      const img = await Promise.all(imagePromies);
      updateOption.productPictures = img;
    } else {
      const p = await Product.findById(req.params.id).exec();
      updateOption.productPictures = p.productPictures;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateOption,
      },
      { new: true, useFindAndModify: false }
    ).exec();

    if (labels !== undefined) {
      const labelData = JSON.parse(labels);
      const oldLabels = updatedProduct.labels;

      const removeLabels = oldLabels.filter(
        (oldLabel) => !labelData.includes(oldLabel)
      );
      const addLabels = labelData.filter(
        (newLabel) => !oldLabels.includes(newLabel)
      );
      await Promise.all([
        LabelController.removeLabelFromProduct(
          updatedProduct._id,
          removeLabels
        ),
        LabelController.addLabelToProduct(updatedProduct._id, addLabels),
      ]);
    }

    const latestProduct = await Product.findById(updatedProduct._id);
    if (latestProduct) return Update(res, { latestProduct });
    return NotFound(res, "Product");
  } catch (error) {
    return ServerError(res, error.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isAvailable: false },
      },
      { new: true, useFindAndModify: false }
    ).exec();
    if (deletedProduct) return Delete(res, "Product has been deleted...");
    return NotFound(res, "Product");
  } catch (error) {
    return ServerError(res, error.message);
  }
};

exports.enable = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isAvailable: true },
      },
      { new: true, useFindAndModify: false }
    ).exec();
    if (updatedProduct) return Update(res, { updatedProduct });
    return NotFound(res, "Product");
  } catch (error) {
    return ServerError(res, error.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    console.log(req.params.id);
    const categoryOfProduct = await Category.findOne({
      name: product.category,
    });
    // console.log(product.isAvailable, categoryOfProduct.isAvailable, req.user.role)
    if (
      (product.isAvailable === false ||
        categoryOfProduct.isAvailable === false) &&
      req.user.role !== "admin" &&
      req.user.role !== "staff"
    )
      return NotFound(res, "Product");

    // return res.sendFile(__dirname + '/index.html');
    return Get(res, { product });
  } catch (error) {
    return ServerError(res, error.message);
  }
};

exports.getByQuery = async (req, res) => {
  const { q, sortBy, sortOrder, ...filters } = req.query;

  const listQuery = [
    {
      $match: { isAvailable: true },
    },
  ];

  if (q === "all") {
    const searchQuery = {
      $match: { name: { $exists: true } },
    };
    listQuery.push(searchQuery);
  } else if (q) {
    const searchName = q;
    const rgx = (pattern) => new RegExp(`.*${pattern}.*`);
    const searchNameRgx = rgx(searchName);

    const searchQuery = {
      $match: { name: { $regex: searchNameRgx, $options: "i" } },
    };
    listQuery.push(searchQuery);
  }

  //"asc" là tăng dần còn "desc" là giảm dần
  if (sortBy) {
    const order = sortOrder === "asc" ? 1 : -1;
    listQuery.push({ $sort: { [sortBy]: order } });
  }

  const rangeFilter = "..";
  const collectionFilter = ",";
  for (const filter in filters) {
    const element = filters[filter];

    if (element.indexOf(rangeFilter) !== -1) {
      const max = 99999999999999;
      const min = 0;
      const fromToRawInput = element.split(rangeFilter);

      const selectValueAndRemoveUnit = (input) => {
        let endOfValue = 0;

        if (input.match(/[^0-9]/)) {
          endOfValue = input.match(/[^0-9]/).index;
          return input.slice(0, endOfValue);
        } else {
          return input;
        }
      };

      const fromTo = fromToRawInput.map(selectValueAndRemoveUnit);

      const from = fromTo[0] === "" ? min : parseFloat(fromTo[0]);
      const to = fromTo[1] === "" ? max : parseFloat(fromTo[1]);

      const rangeQuery = {
        $match: {
          $or: [
            { [filter]: { $gte: from, $lte: to } },
            {
              categoryInfo: {
                $elemMatch: { name: filter, value: { $gte: from, $lte: to } },
              },
            },
          ],
        },
      };

      listQuery.push(rangeQuery);
    } else {
      if (element.indexOf(collectionFilter) !== -1) {
        const collections = element.split(collectionFilter);

        const collectionQuery = {
          $match: {
            $or: [
              { [filter]: { $in: collections } },
              {
                categoryInfo: {
                  $elemMatch: { name: filter, value: { $in: collections } },
                },
              },
            ],
          },
        };

        listQuery.push(collectionQuery);
      } else {
        const singeQuery = {
          $match: {
            $or: [
              { [filter]: element },
              {
                categoryInfo: {
                  $elemMatch: { name: filter, value: element },
                },
              },
            ],
          },
        };

        listQuery.push(singeQuery);
      }
    }
  }

  try {
    const productsFilter = await Product.aggregate(listQuery).exec();

    const filterAvailableProduct = await getProductHasCategoryAvailable(
      productsFilter
    );

    if (filterAvailableProduct) {
      const { page, perPage } = req.params;
      const result = pagination(filterAvailableProduct, page, perPage);
      result.metadata = addMetaDataForSearchInCategory(filterAvailableProduct);
      return Get(res, { result });
    }

    NotFound(res, "Product");
  } catch (error) {
    return ServerError(res, error.messages);
  }
};

exports.getAll = async (req, res) => {
  try {
    const products = await Product.find({ isAvailable: true });
    // console.log(products)
    const filterAvailableProduct = await getProductHasCategoryAvailable(
      products
    );
    if (!filterAvailableProduct) return NotFound(res, "Products");
    return Get(res, { result: { products: filterAvailableProduct } });
  } catch (error) {
    return ServerError(res, error.messages);
  }
};

exports.getAllCommentProduct = async (req, res) => {
  try {
    const comments = await Comment.aggregate([
      {
        $match: { productId: mongoose.Types.ObjectId(req.params.productId) },
      },
      {
        $project: { comment: 1 },
      },
      {
        $unwind: "$comment",
      },
      {
        $facet: {
          result: [
            {
              $sort: { "comment.createdAt": -1 },
            },
          ],
          total: [
            {
              $group: {
                _id: "$comment.rating",
                count: { $count: {} },
              },
            },
          ],
        },
      },
    ]);

    const result = pagination(
      comments[0].result,
      req.params.page,
      req.params.perPage
    );
    const total = comments[0].total;

    return Get(res, {
      result: {
        result,
        total,
      },
    });
  } catch (error) {
    return ServerError(res, error.messages);
  }
};

exports.getAllNotify = async (req, res) => {
  try {
    const notifies = await Notify.find({ status: "new" }).sort({
      createdAt: -1,
    });

    notifies.total = notifies.length;
    return Get(res, { result: { notifies, total: notifies.length } });
  } catch (error) {
    return ServerError(res, error.message);
  }
};

exports.changeCommentStatusToOld = async (req, res) => {
  try {
    const updatedNotify = await Notify.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status: "old" },
      },
      { new: true, useFindAndModify: false }
    );

    if (updatedNotify) return Update(res, { updatedNotify });
    return NotFound(res, "Notify");
  } catch (error) {
    return ServerError(res, error.message);
  }
};

exports.findPositionOfCommentBeChose = async (req, res) => {
  try {
    const allProductComments = await Comment.findOne({
      productId: req.params.productId,
    });

    const commentNeedToFindPosition = allProductComments.comment.find(
      (comment) => comment._id.toString() === req.params.commentId
    );

    const commentIndex = await Comment.aggregate([
      {
        $match: { productId: mongoose.Types.ObjectId(req.params.productId) },
      },
      {
        $project: { comment: 1 },
      },
      {
        $unwind: "$comment",
      },
      // {
      //   $sort:
      //     { "comment.createdAt": -1 }
      // },
      {
        $match: {
          "comment.createdAt": { $gt: commentNeedToFindPosition.createdAt },
        },
      },
      {
        $group: {
          _id: null,
          count: { $count: {} },
        },
      },
    ]);

    console.log(commentIndex);

    //If commentIndex is empty array so this comment index is 0 so position is 1
    const position =
      commentIndex && commentIndex.length > 0 ? commentIndex[0].count + 1 : 1;

    const page =
      position % req.params.commentPerPage === 0
        ? Math.floor(position / req.params.commentPerPage)
        : Math.floor(position / req.params.commentPerPage) + 1;

    return Get(res, { result: { position, page } });
  } catch (error) {
    console.log(error);
    return ServerError(res, error.messages);
  }
};

exports.checkUserCanComment = async (req, res) => {
  try {
    const isUserComment = await Comment.findOne({
      productId: req.params.productId,
      "comment.userId": req.user._id,
    });

    if (isUserComment)
      return Get(res, {
        result: {
          canComment: false,
          comment: isUserComment,
        },
      });
    return Get(res, { result: true });
  } catch (error) {
    return ServerError(res, error.message);
  }
};

function pagination(items, page = 1, perPage = 8) {
  const previousItem = (page - 1) * Number(perPage);
  return {
    result: {
      items: items.slice(previousItem, previousItem + Number(perPage)),
      totalPage: Math.ceil(items.length / Number(perPage)),
      currentPage: page,
      totalProduct: items.length,
    },
  };
}

function addMetaDataForSearchInCategory(products) {
  // Use for search page to multi query
  return {
    categories: [...new Set(products.map((p) => p.category))],
    brands: [
      ...new Set(
        products.map(
          (p) =>
            p.categoryInfo.find((c) => c.name.toLowerCase() === "brand")?.value
        )
      ),
    ],
  };
}

//prevent active html code on client(XSS)
// function escape(s) {
//   return s.replace(
//       /[^0-9A-Za-z ]/g,
//       c => "&#" + c.charCodeAt(0) + ";"
//   );
// }
function escape(s) {
  let lookup = {
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
    "<": "&lt;",
    ">": "&gt;",
  };
  return s.replace(/[&"'<>]/g, (c) => lookup[c]);
}

async function getProductHasCategoryAvailable(products) {
  try {
    await Promise.all(
      products.map(async (product, index) => {
        const categoryOfProduct = await Category.findOne({
          name: product.category,
        });
        if (categoryOfProduct === null) {
          // console.log(product.category);
        }
        product.isAvailable = categoryOfProduct.isAvailable;
      })
    );
  } catch (error) {
    // console.log(error);
  }

  return products.filter((product) => product.isAvailable);
}

async function deleteOldProductImg(id) {
  const oldImg = await Product.aggregate()
    .match({ _id: mongoose.Types.ObjectId(id) })
    .project({ _id: 0, productPictures: 1 })
    .exec();
  // const imgBeforeUpdate = await Product.aggregate([{$match:{_id: mongoose.Types.ObjectId(req.params.id)}},
  //{$project:{productPictures: 1}}])
  // .exec();
  // oldImg.forEach(async item => await fs.unlink('/upload/' + item));

  oldImg[0].productPictures.forEach(
    async (item) => await fs.unlink("./uploads/" + item)
  );
}

const getImagePublicId = (imageUrl) => {
  console.log({ imageUrl });
  return imageUrl.split("/").slice(-1)[0].split(".")[0];
};

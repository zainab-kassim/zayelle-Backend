// import { DataTypes, Model, Optional } from 'sequelize';
// import Collection from './collection.model';
// import { sequelize } from '../config/db';

// interface ProductAttributes {
//     id: number;
//     collectionId: number;
//     name: string;
//     slug?: string;
//     description: string;
//     price: string;
//     size: Array<string>;
//     quantity: number;
//     image: Array<string>;
//     status: boolean;
// }

// class Product extends Model<ProductAttributes, Optional<ProductAttributes, 'id'>> implements ProductAttributes {
//     id!: number;
//     collectionId!: number;
//     name!: string;
//     slug!: string;
//     description!: string;
//     price!: string;
//     size!: Array<string>;
//     quantity!: number;
//     image!: Array<string>;
//     status!: boolean;
// }

// Product.init({
//     id: {
//         type: DataTypes.INTEGER,
//         autoIncrement: true,
//         primaryKey: true
//     },

//     collectionId: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//     },
//     name: {
//         type: DataTypes.STRING,
//         allowNull: false,
//     },
//     slug: {
//         type: DataTypes.STRING,
//         allowNull: true,
//         unique: true,
//     },
//     description: {
//         type: DataTypes.STRING,
//         allowNull: false,
//     },
//     price: {
//         type: DataTypes.STRING,
//         allowNull: false,
//     },
//     size: {
//         type: DataTypes.ARRAY(DataTypes.STRING),
//         allowNull: false,
//     },
//     quantity: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//     },
//     image: {
//         type: DataTypes.JSONB,
//         allowNull: false,
//         defaultValue: []
//     },
//     status: {
//         type: DataTypes.BOOLEAN,
//         allowNull: false,
//     },
// }, {

//     sequelize,
//     tableName: 'products'
// })

// Collection.hasMany(Product, {
//     as: 'Products',
//     foreignKey: 'collectionId',
// });
// Product.belongsTo(Collection, {
//     as: 'Collection',
//     foreignKey: 'collectionId',
// });

// export default Product;

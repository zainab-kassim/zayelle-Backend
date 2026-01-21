// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../config/db';


// interface CollectionAttributes {
//     id: number;
//     name: string;
//     description: string;
//     image: string;
// }

// class Collection extends Model<CollectionAttributes, Optional<CollectionAttributes, 'id'>> implements CollectionAttributes {
//     id!:number;
//     name!:string;
//     description!:string;
//     image!:string;
// }

// Collection.init({
//     id:{
//         type:DataTypes.INTEGER,
//         autoIncrement:true,
//         primaryKey:true
//     },
//     name:{
//         type:DataTypes.STRING,
//         allowNull:false,
//     },
//     description:{
//         type:DataTypes.STRING,
//         allowNull:false,
//     },
//     image:{
//         type:DataTypes.STRING,
//         allowNull:false,
//     }
// },{
//     sequelize,
//     tableName:'collections'
// })

// export default Collection;
import { GetProductByName,GetProductbyCollectionId,GetProducts } from "../controllers/product.controller";
import { Router } from "express";

const router= Router()
router.get('/',GetProducts);
router.get('/collection/:collectionSlug',GetProductbyCollectionId);
router.get('/:slug',GetProductByName);

export default router;
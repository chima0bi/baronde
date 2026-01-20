import { Request, Response } from 'express';
import Cart from '../model/cart';
import Image from '../model/image'; 


export const addItemToCart = async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?.id; 

    if (!productId || !quantity) {
     res.status(400).json({ message: 'Product ID and quantity are required.' });
       return
    }

    const product = await Image.findById(productId);
    if (!product) {
    res.status(404).json({ message: 'Product not found.' });
      return 
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity } as any);
    }

    await cart.save();
    res.status(200).json({ status: 'success', message: 'Item added to cart successfully', data: cart });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};


export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      res.status(404).json({ message: 'Cart not found for this user.' });
       return
    }

    res.status(200).json({ status: 'success', message: 'Cart fetched successfully', data: cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};


export const updateCartItemQuantity = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?.id;

    if (!quantity || quantity <= 0) {
     res.status(400).json({ message: 'Quantity must be a positive number.' });
      return 
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
     res.status(404).json({ message: 'Cart not found.' });
       return
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      res.status(200).json({ status: 'success', message: 'Item quantity updated successfully', data: cart });
    } else {
      res.status(404).json({ message: 'Item not found in cart.' });
    }
  } catch (error) {
    console.error('Update cart item quantity error:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};


export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      res.status(404).json({ message: 'Cart not found.' });
       return
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    if (cart.items.length === initialLength) {
      res.status(404).json({ message: 'Item not found in cart.' });
       return
    }

    await cart.save();
    res.status(200).json({ status: 'success', message: 'Item removed from cart successfully', data: cart });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};


export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      res.status(404).json({ message: 'Cart not found.' });
       return
    }

    cart.items = [];
    await cart.save();
    res.status(200).json({ status: 'success', message: 'Cart cleared successfully', data: cart });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

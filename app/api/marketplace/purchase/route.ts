import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { BusinessFeesManager } from "@/lib/business-fees"

export async function POST(request: NextRequest) {
  try {
    const { productId, buyerId, sellerId, amount, paymentId, txid, shippingAddress } = await request.json()

    console.log("[v0] Processing marketplace purchase:", {
      productId,
      buyerId,
      sellerId,
      amount,
    })

    const supabase = await createClient()

    const { data: sellerBusiness, error: sellerError } = await supabase
      .from("marketplace_business_settings")
      .select("*")
      .eq("user_id", sellerId)
      .single()

    if (sellerError || !sellerBusiness) {
      console.error("[v0] Seller not found or not approved:", sellerError)
      return NextResponse.json(
        { error: "Seller not found. Please ensure the seller has a verified business account." },
        { status: 400 },
      )
    }

    console.log("[v0] Seller business found:", sellerBusiness.business_name)

    const transactionFee = BusinessFeesManager.calculateTransactionFee(sellerId, amount)
    const netAmount = amount - transactionFee

    console.log("[v0] Fee calculation:", {
      saleAmount: amount,
      transactionFee,
      netAmount,
    })

    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    const { data: order, error: orderError } = await supabase
      .from("marketplace_orders")
      .insert({
        id: orderId, // Add generated order ID
        product_id: productId,
        buyer_id: buyerId,
        seller_id: sellerId,
        amount,
        transaction_fee: transactionFee,
        net_amount: netAmount,
        payment_id: paymentId,
        txid,
        shipping_address: shippingAddress || null,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      console.error("[v0] Order creation error:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    console.log("[v0] Order created successfully:", order.id)

    const { error: appWalletError } = await supabase.from("app_wallet").insert({
      amount: transactionFee,
      source: `Marketplace sale: ${productId}`,
      transaction_type: "marketplace_fee",
      reference_id: order.id,
      created_at: new Date().toISOString(),
    })

    if (appWalletError) {
      console.error("[v0] App wallet update error:", appWalletError)
    }

    const { error: balanceError } = await supabase.rpc("update_seller_balance", {
      p_seller_id: sellerId,
      p_amount: netAmount,
      p_balance_type: "pending",
    })

    if (balanceError) {
      console.error("[v0] Seller balance update error:", balanceError)
      const { data: existingBalance } = await supabase
        .from("seller_balances")
        .select("*")
        .eq("seller_id", sellerId)
        .single()

      if (existingBalance) {
        await supabase
          .from("seller_balances")
          .update({
            pending_balance: existingBalance.pending_balance + netAmount,
            total_earnings: existingBalance.total_earnings + netAmount,
            last_updated: new Date().toISOString(),
          })
          .eq("seller_id", sellerId)
      } else {
        await supabase.from("seller_balances").insert({
          seller_id: sellerId,
          available_balance: 0,
          pending_balance: netAmount,
          total_earnings: netAmount,
          total_withdrawn: 0,
          last_updated: new Date().toISOString(),
        })
      }
    }

    BusinessFeesManager.recordSale(sellerId, productId, "", amount, transactionFee)

    const { error: stockError } = await supabase.rpc("decrement_product_stock", {
      p_product_id: productId,
    })

    if (stockError) {
      console.error("[v0] Stock decrement error:", stockError)
    }

    const { data: updatedProduct } = await supabase
      .from("marketplace_products")
      .select("stock, name")
      .eq("id", productId)
      .single()

    if (updatedProduct && updatedProduct.stock <= 0) {
      await supabase.from("marketplace_products").update({ status: "inactive" }).eq("id", productId)

      console.log("[v0] Product out of stock, set to inactive:", productId)
    }

    try {
      const notifications = []

      // Seller notification
      notifications.push({
        user_id: sellerId,
        type: "sale",
        title: "New Sale!",
        message: `You sold "${updatedProduct?.name || "a product"}" for ${amount}π. Net earnings: ${netAmount.toFixed(2)}π`,
        data: { orderId: order.id, productId, amount, netAmount },
        created_at: new Date().toISOString(),
        read: false,
      })

      // Buyer notification
      notifications.push({
        user_id: buyerId,
        type: "purchase",
        title: "Purchase Complete!",
        message: `Your order for "${updatedProduct?.name || "a product"}" has been placed. Seller: ${sellerBusiness.business_name}`,
        data: { orderId: order.id, productId, amount },
        created_at: new Date().toISOString(),
        read: false,
      })

      // Admin notification
      notifications.push({
        user_id: "admin",
        type: "sale",
        title: "Marketplace Sale",
        message: `${sellerBusiness.business_name} sold "${updatedProduct?.name || "a product"}" for ${amount}π`,
        data: { orderId: order.id, productId, sellerId, buyerId, amount, transactionFee },
        created_at: new Date().toISOString(),
        read: false,
      })

      const { error: notifError } = await supabase.from("notifications").insert(notifications)

      if (notifError) {
        console.error("[v0] Failed to create notifications:", notifError)
      } else {
        console.log("[v0] Notifications sent to seller, buyer, and admin")
      }
    } catch (notifError) {
      console.error("[v0] Notification creation error:", notifError)
    }

    console.log("[v0] Purchase processed successfully:", order.id)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      netAmount,
      transactionFee,
      sellerName: sellerBusiness.business_name,
    })
  } catch (error) {
    console.error("[v0] Purchase processing error:", error)
    return NextResponse.json({ error: "Purchase processing failed" }, { status: 500 })
  }
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Container,
  Tab,
  Tabs,
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { getSafeErrorMessage } from "../../helpers/api";
import {
  actualizarEstadoPedidoAdmin,
  actualizarProductoAdmin,
  actualizarVisibilidadProductoAdmin,
  crearProductoAdmin,
  isAdminSessionError,
  listarPedidosAdmin,
  listarProductosAdmin,
  obtenerPedidoAdmin,
  resolverRevisionPedidoAdmin,
} from "../../helpers/adminApi";
import ConfirmacionAdmin from "../admin/ConfirmacionAdmin";
import ModalPedidoAdmin from "../admin/ModalPedidoAdmin";
import ModalProductoAdmin from "../admin/ModalProductoAdmin";
import SeccionPedidosAdmin from "../admin/SeccionPedidosAdmin";
import SeccionProductosAdmin from "../admin/SeccionProductosAdmin";
import {
  getNotaRevisionError,
  getOrderId,
  getProductId,
  normalizarNotaRevision,
  puedeActualizarEstadoOperativo,
  PRODUCTO_VACIO,
} from "../admin/utilidadesAdmin";
import "../../styles/admin.css";

const upsertById = (items, nextItem, getId) => {
  const nextId = getId(nextItem);

  if (!nextId) return items;

  const exists = items.some((item) => getId(item) === nextId);

  return exists
    ? items.map((item) => (getId(item) === nextId ? nextItem : item))
    : [nextItem, ...items];
};

export default function Admin() {
  const { token, admin, logout } = useAuth();
  const orderRequestRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [productModal, setProductModal] = useState(null);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState("");
  const [productToToggle, setProductToToggle] = useState(null);
  const [productProcessingId, setProductProcessingId] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [reviewResolution, setReviewResolution] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const resolveError = useCallback(
    (error, fallback) => {
      if (error?.name === "AbortError") return "";

      if (isAdminSessionError(error)) {
        logout();
        return "";
      }

      return getSafeErrorMessage(error, fallback);
    },
    [logout],
  );

  const loadProducts = useCallback(
    async ({ signal } = {}) => {
      setProductsLoading(true);
      setProductsError("");

      try {
        const nextProducts = await listarProductosAdmin(token, { signal });

        if (!signal?.aborted) setProducts(nextProducts);
      } catch (error) {
        const message = resolveError(
          error,
          "No pudimos cargar los productos.",
        );
        if (!signal?.aborted && message) setProductsError(message);
      } finally {
        if (!signal?.aborted) setProductsLoading(false);
      }
    },
    [resolveError, token],
  );

  const loadOrders = useCallback(
    async ({ signal } = {}) => {
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const nextOrders = await listarPedidosAdmin(token, { signal });

        if (!signal?.aborted) setOrders(nextOrders);
      } catch (error) {
        const message = resolveError(error, "No pudimos cargar los pedidos.");
        if (!signal?.aborted && message) setOrdersError(message);
      } finally {
        if (!signal?.aborted) setOrdersLoading(false);
      }
    },
    [resolveError, token],
  );

  useEffect(() => {
    const productsController = new AbortController();
    const ordersController = new AbortController();

    void loadProducts({ signal: productsController.signal });
    void loadOrders({ signal: ordersController.signal });

    return () => {
      productsController.abort();
      ordersController.abort();
      orderRequestRef.current?.abort();
    };
  }, [loadOrders, loadProducts]);

  const openCreateProduct = () => {
    setProductError("");
    setProductModal({ mode: "create", product: PRODUCTO_VACIO });
  };

  const openEditProduct = (product) => {
    setProductError("");
    setProductModal({ mode: "edit", product });
  };

  const closeProductModal = () => {
    if (productSaving) return;
    setProductModal(null);
    setProductError("");
  };

  const saveProduct = async (formData) => {
    if (!productModal) return;

    setProductSaving(true);
    setProductError("");

    try {
      const savedProduct =
        productModal.mode === "edit"
          ? await actualizarProductoAdmin(
              token,
              getProductId(productModal.product),
              formData,
            )
          : await crearProductoAdmin(token, formData);

      if (!savedProduct) {
        throw new Error("La API no devolvió el producto guardado.");
      }

      setProducts((current) =>
        upsertById(current, savedProduct, getProductId),
      );
      setProductModal(null);
      setFeedback({
        variant: "success",
        message:
          productModal.mode === "edit"
            ? "El producto se actualizó correctamente."
            : "El producto se creó correctamente.",
      });
    } catch (error) {
      const message = resolveError(error, "No pudimos guardar el producto.");
      if (message) setProductError(message);
    } finally {
      setProductSaving(false);
    }
  };

  const confirmToggleProduct = async () => {
    const productId = getProductId(productToToggle);
    if (!productId) return;

    setProductProcessingId(productId);

    try {
      const updatedProduct = await actualizarVisibilidadProductoAdmin(
        token,
        productId,
        !productToToggle.active,
      );

      if (!updatedProduct) {
        throw new Error("La API no devolvió el producto actualizado.");
      }

      setProducts((current) =>
        upsertById(current, updatedProduct, getProductId),
      );
      setFeedback({
        variant: "success",
        message: updatedProduct.active
          ? "El producto ya está visible en la tienda."
          : "El producto quedó oculto de la tienda.",
      });
      setProductToToggle(null);
    } catch (error) {
      const message = resolveError(
        error,
        "No pudimos cambiar la visibilidad del producto.",
      );
      if (message) {
        setFeedback({ variant: "danger", message });
        setProductToToggle(null);
      }
    } finally {
      setProductProcessingId("");
    }
  };

  const openOrder = async (order) => {
    const orderId = getOrderId(order);
    if (!orderId) return;

    orderRequestRef.current?.abort();
    const controller = new AbortController();
    orderRequestRef.current = controller;

    setSelectedOrder(order);
    setOrderModalOpen(true);
    setOrderDetailLoading(true);
    setOrderError("");
    setReviewResolution(null);

    try {
      const detail = await obtenerPedidoAdmin(token, orderId, {
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        if (!detail) throw new Error("La API no devolvió el pedido.");
        setSelectedOrder(detail);
      }
    } catch (error) {
      const message = resolveError(
        error,
        "No pudimos cargar el detalle del pedido.",
      );
      if (!controller.signal.aborted && message) setOrderError(message);
    } finally {
      if (!controller.signal.aborted) setOrderDetailLoading(false);
    }
  };

  const closeOrderModal = () => {
    if (orderSaving || reviewSaving) return;
    orderRequestRef.current?.abort();
    setOrderModalOpen(false);
    setSelectedOrder(null);
    setOrderError("");
    setReviewResolution(null);
  };

  const saveOrderStatus = async (estadoOperativo) => {
    const orderId = getOrderId(selectedOrder);
    if (!orderId) return;

    if (
      estadoOperativo === selectedOrder?.estadoOperativo ||
      !puedeActualizarEstadoOperativo(selectedOrder, estadoOperativo)
    ) {
      setOrderError(
        "Elegí una transición operativa disponible para este pedido.",
      );
      return;
    }

    setOrderSaving(true);
    setOrderError("");

    try {
      const updatedOrder = await actualizarEstadoPedidoAdmin(
        token,
        orderId,
        estadoOperativo,
      );

      if (!updatedOrder) {
        throw new Error("La API no devolvió el pedido actualizado.");
      }

      setOrders((current) => upsertById(current, updatedOrder, getOrderId));
      setSelectedOrder(updatedOrder);
      setOrderModalOpen(false);
      setFeedback({
        variant: "success",
        message: "El estado operativo del pedido se actualizó correctamente.",
      });
    } catch (error) {
      const message = resolveError(
        error,
        "No pudimos actualizar el estado del pedido.",
      );
      if (message) setOrderError(message);
    } finally {
      setOrderSaving(false);
    }
  };

  const requestReviewResolution = (note) => {
    const orderId = getOrderId(selectedOrder);
    const normalizedNote = normalizarNotaRevision(note);
    const noteError = getNotaRevisionError(normalizedNote);

    if (!orderId || !selectedOrder?.requiresReview) {
      setOrderError("Este pedido ya no tiene una revisión pendiente.");
      return;
    }

    if (noteError) {
      setOrderError(noteError);
      return;
    }

    setOrderError("");
    setReviewResolution({
      orderId,
      orderLabel: selectedOrder.numero || `#${orderId}`,
      note: normalizedNote,
    });
  };

  const confirmReviewResolution = async () => {
    if (!reviewResolution) return;

    const orderId = getOrderId(selectedOrder);

    if (
      orderId !== reviewResolution.orderId ||
      !selectedOrder?.requiresReview
    ) {
      setReviewResolution(null);
      setOrderError("Este pedido ya no tiene una revisión pendiente.");
      return;
    }

    setReviewSaving(true);
    setOrderError("");

    try {
      const updatedOrder = await resolverRevisionPedidoAdmin(
        token,
        reviewResolution.orderId,
        reviewResolution.note,
      );

      if (!updatedOrder) {
        throw new Error("La API no devolvió el pedido actualizado.");
      }

      setOrders((current) => upsertById(current, updatedOrder, getOrderId));
      setSelectedOrder(updatedOrder);
      setReviewResolution(null);
      setFeedback({
        variant: "success",
        message: "La revisión del pedido quedó resuelta y auditada.",
      });
    } catch (error) {
      const message = resolveError(
        error,
        "No pudimos resolver la revisión del pedido.",
      );
      setReviewResolution(null);
      if (message) setOrderError(message);
    } finally {
      setReviewSaving(false);
    }
  };

  const adminName =
    admin?.name || admin?.nombre || admin?.email || "Administración";
  const selectedOrderKey = [
    getOrderId(selectedOrder) || "pedido",
    selectedOrder?.estadoOperativo || "pendiente",
    selectedOrder?.requiresReview ? "requiere-revision" : "sin-revision",
    selectedOrder?.reviewResolutions?.length || 0,
    selectedOrder?.updatedAt || "sin-actualizacion",
  ].join("-");

  return (
    <main className="admin-page">
      <Container fluid="xl" className="admin-shell">
        <header className="admin-header">
          <div className="admin-brand">
            <span className="admin-brand-mark" aria-hidden="true">
              <i className="bi bi-flower2"></i>
            </span>
            <div>
              <p className="admin-kicker mb-1">El Jardín de Luna</p>
              <h1 className="font-playfair mb-0">Panel administrativo</h1>
            </div>
          </div>

          <div className="admin-header-actions">
            <div>
              <span>Sesión iniciada</span>
              <strong>{adminName}</strong>
            </div>
            <Button type="button" variant="outline-secondary" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        {feedback && (
          <Alert
            variant={feedback.variant}
            dismissible
            onClose={() => setFeedback(null)}
            role="status"
          >
            {feedback.message}
          </Alert>
        )}

        <Tabs
          defaultActiveKey="products"
          className="admin-tabs"
          mountOnEnter
        >
          <Tab eventKey="products" title="Productos">
            <SeccionProductosAdmin
              products={products}
              loading={productsLoading}
              errorMessage={productsError}
              processingId={productProcessingId}
              onRetry={() => void loadProducts()}
              onCreate={openCreateProduct}
              onEdit={openEditProduct}
              onToggleActive={setProductToToggle}
            />
          </Tab>
          <Tab eventKey="orders" title="Pedidos">
            <SeccionPedidosAdmin
              orders={orders}
              loading={ordersLoading}
              errorMessage={ordersError}
              onRetry={() => void loadOrders()}
              onOpen={(order) => void openOrder(order)}
            />
          </Tab>
        </Tabs>
      </Container>

      {productModal && (
        <ModalProductoAdmin
          key={`${productModal.mode}-${getProductId(productModal.product) || "new"}`}
          show
          mode={productModal.mode}
          product={productModal.product}
          saving={productSaving}
          errorMessage={productError}
          onClose={closeProductModal}
          onSave={saveProduct}
        />
      )}

      <ConfirmacionAdmin
        show={Boolean(productToToggle)}
        title={
          productToToggle?.active ? "Ocultar producto" : "Publicar producto"
        }
        message={
          productToToggle?.active
            ? `${productToToggle?.name || "El producto"} dejará de estar visible en la tienda.`
            : `${productToToggle?.name || "El producto"} volverá a estar visible en la tienda.`
        }
        confirmLabel={productToToggle?.active ? "Ocultar" : "Publicar"}
        confirmVariant={productToToggle?.active ? "secondary" : "success"}
        pending={Boolean(productProcessingId)}
        onCancel={() => setProductToToggle(null)}
        onConfirm={() => void confirmToggleProduct()}
      />

      {orderModalOpen && (
        <ModalPedidoAdmin
          key={selectedOrderKey}
          show
          pedido={selectedOrder}
          loading={orderDetailLoading}
          saving={orderSaving || reviewSaving}
          errorMessage={orderError}
          onClose={closeOrderModal}
          onSave={saveOrderStatus}
          onRequestReviewResolution={requestReviewResolution}
        />
      )}

      <ConfirmacionAdmin
        show={Boolean(reviewResolution)}
        title="Resolver revisión excepcional"
        message={
          reviewResolution
            ? `Vas a marcar como resuelta la revisión del pedido ${reviewResolution.orderLabel}. La nota «${reviewResolution.note}» quedará en el historial. El estado de pago y el stock no se modificarán.`
            : ""
        }
        confirmLabel="Confirmar resolución"
        confirmVariant="warning"
        pending={reviewSaving}
        onCancel={() => setReviewResolution(null)}
        onConfirm={() => void confirmReviewResolution()}
      />
    </main>
  );
}

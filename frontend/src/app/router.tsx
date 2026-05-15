import { createBrowserRouter } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminRoute from "./routes/AdminRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import MyPage from "@/pages/MyPage";
import SocialConnectPage from "@/pages/SocialConnectPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import PopularMorePage from "@/pages/PopularMorePage";
import RecommendMorePage from "@/pages/RecommendMorePage";
import ShopPage from "@/pages/ShopPage";
import RentalShopPage from "@/pages/RentalShopPage";
import AuctionShopPage from "@/pages/AuctionShopPage";
import DeliveryPage from "@/pages/DeliveryPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import PermissionManagePage from "@/pages/admin/PermissionManagePage";
import RoleManagePage from "@/pages/admin/RoleManagePage";
import MemberManagePage from "@/pages/admin/members/MemberManagePage";
import MemberFormPage from "@/pages/admin/members/MemberFormPage";
import ProductListPage from "@/pages/admin/products/ProductListPage";
import ProductFormPage from "@/pages/admin/products/ProductFormPage";
import CategoryManagePage from "@/pages/admin/catalog/CategoryManagePage";
import BrandManagePage from "@/pages/admin/catalog/BrandManagePage";
import FilterManagePage from "@/pages/admin/catalog/FilterManagePage";
import FilterGroupManagePage from "@/pages/admin/catalog/FilterGroupManagePage";
import TagManagePage from "@/pages/admin/catalog/TagManagePage";
import ItemBoardPage from "@/pages/admin/items/ItemBoardPage";
import MappingManagePage from "@/pages/admin/settings/MappingManagePage";
import RentalManagePage from "@/pages/admin/rental/RentalManagePage";
import ChatManagePage from "@/pages/admin/chat/ChatManagePage";
import ReviewReportManagePage from "@/pages/admin/ReviewReportManagePage";
import LogManagePage from "@/pages/admin/log/LogManagePage";
import SearchLogManagePage from "@/pages/admin/log/SearchLogManagePage";
import MainManagePage from "@/pages/admin/main/MainManagePage";
import TradeManagePage from "@/pages/admin/trade/TradeManagePage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import CustomerServicePage from "@/pages/CustomerServicePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <UserLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "mypage", element: <MyPage /> },
      { path: "social/connect", element: <SocialConnectPage /> },
      { path: "product/:id", element: <ProductDetailPage /> },
      { path: "popular", element: <PopularMorePage /> },
      { path: "recommend", element: <RecommendMorePage /> },
      { path: "shop", element: <ShopPage /> },
      { path: "rental", element: <RentalShopPage /> },
      { path: "auction", element: <AuctionShopPage /> },
      { path: "delivery", element: <DeliveryPage /> },
      { path: "terms", element: <TermsPage /> },
      { path: "privacy", element: <PrivacyPolicyPage /> },
      { path: "customer-service", element: <CustomerServicePage /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "members", element: <MemberManagePage /> },
          { path: "member/register", element: <MemberFormPage mode="create" /> },
          { path: "member/edit/:id", element: <MemberFormPage mode="edit" /> },
          { path: "main", element: <MainManagePage /> },
          { path: "products", element: <ProductListPage /> },
          { path: "products/register", element: <ProductFormPage key="product-create" mode="create" /> },
          { path: "products/edit/:id", element: <ProductFormPage mode="edit" /> },
          { path: "categories", element: <CategoryManagePage /> },
          { path: "brands", element: <BrandManagePage /> },
          { path: "tags", element: <TagManagePage /> },
          { path: "filters", element: <FilterManagePage /> },
          { path: "filter-groups", element: <FilterGroupManagePage /> },
          { path: "settings/category-mappings", element: <MappingManagePage mode="category" /> },
          { path: "settings/brand-mappings", element: <MappingManagePage mode="brand" /> },
          { path: "items/board", element: <ItemBoardPage /> },
          { path: "rental", element: <RentalManagePage /> },
          { path: "trade", element: <TradeManagePage /> },
          { path: "chat", element: <ChatManagePage /> },
          { path: "review-reports", element: <ReviewReportManagePage /> },
          { path: "log", element: <LogManagePage /> },
          { path: "log/search", element: <SearchLogManagePage /> },
          { path: "permissions", element: <PermissionManagePage /> },
          { path: "roles", element: <RoleManagePage /> },
        ],
      },
    ],
  },
]);

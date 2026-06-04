# Analytics Dashboard — Django Backend

Add this to your existing Django backend to power the revenue dashboard.
Revenue counts **only** orders with status `delivered` or `completed`.

---

## 1. views.py — Dashboard endpoint

```python
# In your admin views file (e.g. api/v1/admin/views.py)

from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from orders.models import Order   # adjust import to match your app
from projects.models import Project  # adjust import


PAID_STATUSES = ("delivered", "completed")


def get_range_start(range_key):
    now = timezone.now()
    days = {"1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365}.get(range_key, 30)
    return now - timedelta(days=days)


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        range_key = request.query_params.get("range", "1M")
        since = get_range_start(range_key)

        # ── All-time totals (for stat cards) ──────────────────────────────────
        all_orders = Order.objects.all()
        paid_in_range = Order.objects.filter(
            status__in=PAID_STATUSES,
            created_at__gte=since
        )
        all_in_range = Order.objects.filter(created_at__gte=since)

        total_revenue = paid_in_range.aggregate(
            total=Sum("final_amount")
        )["total"] or 0

        total_orders    = all_in_range.count()
        completed_orders = paid_in_range.count()
        pending_orders   = all_in_range.filter(status="pending").count()
        cancelled_orders = all_in_range.filter(status="cancelled").count()
        active_projects  = Project.objects.filter(status="active").count()

        # ── Revenue series ────────────────────────────────────────────────────
        revenue_series = _build_series(paid_in_range, range_key, since)

        # ── Payment method breakdown (all paid orders ever) ───────────────────
        all_paid = Order.objects.filter(status__in=PAID_STATUSES)
        pay_keys = ["razorpay", "upi", "whatsapp", "bank", "other"]
        pay_breakdown = {}
        for key in pay_keys:
            pay_breakdown[key] = all_paid.filter(pay_method=key).count()
        # catch nulls / unknown
        known = sum(pay_breakdown.values())
        pay_breakdown["razorpay"] += all_paid.filter(
            Q(pay_method__isnull=True) | Q(pay_method="")
        ).count()

        # ── Top projects by revenue ───────────────────────────────────────────
        from django.db.models import FloatField
        from django.db.models.functions import Cast
        top_projects = (
            paid_in_range
            .values("project__title")
            .annotate(count=Count("id"), revenue=Sum("final_amount"))
            .order_by("-revenue")[:5]
        )
        top_projects_list = [
            {
                "name":    p["project__title"] or "Unknown",
                "count":   p["count"],
                "revenue": float(p["revenue"] or 0),
            }
            for p in top_projects
        ]

        return Response({
            "total_revenue":    float(total_revenue),
            "total_orders":     total_orders,
            "completed_orders": completed_orders,
            "pending_orders":   pending_orders,
            "cancelled_orders": cancelled_orders,
            "active_projects":  active_projects,
            "revenue_series":   revenue_series,
            "top_projects":     top_projects_list,
            "pay_breakdown":    pay_breakdown,
        })


def _build_series(paid_qs, range_key, since):
    """Build revenue time-series matching the React frontend expectations."""
    from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
    now = timezone.now()

    if range_key == "1W":
        # Daily for last 7 days
        series = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end   = day_start + timedelta(days=1)
            rev = paid_qs.filter(
                created_at__gte=day_start, created_at__lt=day_end
            ).aggregate(total=Sum("final_amount"))["total"] or 0
            series.append({
                "label":   day.strftime("%a"),   # Mon, Tue…
                "revenue": float(rev),
            })
        return series

    if range_key == "1M":
        # 4-week buckets
        series = []
        for i in range(3, -1, -1):
            week_end   = now - timedelta(weeks=i)
            week_start = week_end - timedelta(days=6)
            rev = paid_qs.filter(
                created_at__gte=week_start, created_at__lte=week_end
            ).aggregate(total=Sum("final_amount"))["total"] or 0
            series.append({"label": f"W{4-i}", "revenue": float(rev)})
        return series

    # Monthly for 3M / 6M / 1Y
    months = {"3M": 3, "6M": 6, "1Y": 12}.get(range_key, 6)
    series = []
    for i in range(months - 1, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
        next_month  = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        rev = paid_qs.filter(
            created_at__gte=month_start, created_at__lt=next_month
        ).aggregate(total=Sum("final_amount"))["total"] or 0
        fmt = "%b" if range_key != "1Y" else "%b %y"
        series.append({"label": month_start.strftime(fmt), "revenue": float(rev)})
    return series
```

---

## 2. urls.py — Register the endpoint

```python
# api/v1/admin/urls.py

from django.urls import path
from .views import AdminDashboardView

urlpatterns += [
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
]
```

---

## 3. Order model — ensure fields exist

```python
# orders/models.py

from django.db import models
from django.conf import settings

PAY_METHODS = [
    ("razorpay", "Razorpay"),
    ("upi",      "UPI / GPay"),
    ("whatsapp", "WhatsApp"),
    ("bank",     "Bank Transfer"),
    ("other",    "Other"),
]

ORDER_STATUSES = [
    ("pending",     "Pending"),
    ("confirmed",   "Confirmed"),
    ("in_progress", "In Progress"),
    ("delivered",   "Delivered"),
    ("completed",   "Completed"),  # alias for delivered
    ("cancelled",   "Cancelled"),
]

class Order(models.Model):
    student      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    project      = models.ForeignKey("projects.Project", on_delete=models.SET_NULL, null=True, blank=True)
    
    # Amount fields — always populate final_amount after coupon
    total_amount    = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_amount    = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    coupon_code  = models.CharField(max_length=50, blank=True)
    pay_method   = models.CharField(max_length=20, choices=PAY_METHODS, default="razorpay")
    status       = models.CharField(max_length=20, choices=ORDER_STATUSES, default="pending")
    notes        = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        # Auto-compute final_amount if not set
        if not self.final_amount:
            self.final_amount = self.total_amount - self.discount_amount
        super().save(*args, **kwargs)
```

---

## 4. Order status endpoint (already needed by frontend)

```python
# api/v1/admin/views.py

class AdminOrderStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        
        status = request.data.get("status")
        if status not in dict(ORDER_STATUSES):
            return Response({"detail": "Invalid status."}, status=400)
        
        order.status = status
        order.save(update_fields=["status", "updated_at"])
        return Response(OrderSerializer(order).data)

# urls.py:
# path("orders/<int:pk>/status/", AdminOrderStatusView.as_view()),
```

---

## Key rules implemented

- **Revenue = only `delivered` + `completed` orders** using `final_amount` (post-coupon price)
- **Range param** (`?range=1W|1M|3M|6M|1Y`) filters both stat cards and time-series
- **Payment breakdown** uses all-time paid orders (not range-filtered) so the donut always shows real distribution
- Data is stored permanently in your PostgreSQL database — no localStorage involved

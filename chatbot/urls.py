from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/chat/', views.chat, name='chat'),
    path('api/dmv/submit/', views.submit_dmv_form, name='submit_dmv_form'),
]
